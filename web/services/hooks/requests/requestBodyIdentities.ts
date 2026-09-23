/**
 * Compact, org-scoped identity helpers for the requests-page body query.
 *
 * The body query key never embeds raw rows: TanStack hashes the key by
 * content, and rows can carry large stored bodies. Instead the key is built
 * from body *resource* identities (org + request_id + signed body URL +
 * asset URLs), so a refreshed URL or asset set changes the key and
 * invalidates stale bodies, while a metadata-only main-query update keeps
 * the key stable.
 *
 * Identities are structured tuples (sorted [key, value] asset pairs, no
 * payload data), so no valid URL/asset string can collide with another
 * row's; TanStack's content hashing handles the array form directly.
 *
 * Pure and dependency-free: unit-testable without React or TanStack.
 */

export interface RequestBodyIdentityRow {
  request_id: string;
  signed_body_url?: string | null;
  asset_urls?: Record<string, string> | null;
}

/** Stable prefix for the requests body query. */
export const REQUESTS_WITH_BODIES_QUERY_NAME = "requestsWithSignedUrls";

/**
 * Structured identity of one request's body resources. Org-scoped, so
 * different tenants can never share a key.
 */
export interface RequestBodyResourceIdentity {
  org: string;
  request_id: string;
  signed_body_url: string;
  assets: [string, string][];
}

/** Compact identity of one row's body resources: [org, request_id, url, assets]. */
export type RequestBodyIdentityTuple = [
  string,
  string,
  string,
  [string, string][],
];

/**
 * Identity of one row's body resources:
 * [org, request_id, signed_body_url ?? "", sorted [key, value] asset pairs].
 * Asset pairs are sorted so object key order never affects the identity.
 */
export function requestBodyIdentity(
  row: RequestBodyIdentityRow,
  orgId: string | null | undefined,
): RequestBodyIdentityTuple {
  const assets =
    row.asset_urls && typeof row.asset_urls === "object"
      ? Object.entries(row.asset_urls)
          .map(([key, value]) => [key, value ?? ""] as [string, string])
          .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
      : [];
  return [
    orgId ?? "",
    row.request_id,
    row.signed_body_url ?? "",
    assets,
  ];
}

/** Canonical key form of a row identity, for the identity-scoped body cache. */
export function requestBodyIdentityKey(
  identity: RequestBodyIdentityTuple,
): string {
  return JSON.stringify(identity);
}

/**
 * Canonical key form of a successful result's resource identity. Same
 * shape as a row tuple (asset pairs pre-sorted), so two forms of the same
 * resources compare equal.
 */
export function resourceIdentityKey(
  identity: RequestBodyResourceIdentity,
): string {
  return JSON.stringify([
    identity.org,
    identity.request_id,
    identity.signed_body_url,
    [...identity.assets].sort((a, b) =>
      a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0,
    ),
  ]);
}

/**
 * Build the body query key: [name, org, ...per-row identity tuples].
 * Serialized size is O(rows + URL lengths), never O(payloads).
 */
export function buildBodyQueryKey(
  rows: readonly RequestBodyIdentityRow[] | null | undefined,
  orgId: string | null | undefined,
): (string | RequestBodyIdentityTuple)[] {
  return [
    REQUESTS_WITH_BODIES_QUERY_NAME,
    orgId ?? "",
    ...(rows ?? []).map((row) => requestBodyIdentity(row, orgId)),
  ];
}

/**
 * One successful body-fetch result, tagged with the resource identity it
 * was fetched for, so a stale fetch (refreshed URL, moved org) can be
 * dropped at merge time.
 */
export interface BodyQueryResult {
  resourceIdentity: RequestBodyResourceIdentity;
  request_id: string;
  request_body: unknown;
  response_body: unknown;
}

/** Per-row outcome of the body query: a successful result, or null. */
export type BodyQueryResults = readonly (BodyQueryResult | null)[];

/** Row shape the requests-page merge works on. */
export interface MergeableRequestRow {
  request_id: string;
  request_body?: unknown;
  response_body?: unknown;
}

/**
 * Join the latest raw rows (metadata + order) with successful body results.
 *
 * A result applies only when it matches the row's *current* full identity
 * (org + request_id + signed body URL + asset set); a stale result from a
 * refreshed URL or a different org is ignored. Unmatched rows are returned
 * by reference, untouched, so their raw fields (which can already hold
 * stored bodies) are preserved. Lookup is O(rows + results) via a Map
 * keyed on org + request_id.
 */
export function mergeRequestRowsWithBodies<T extends MergeableRequestRow>(
  rawRows: readonly T[],
  results: BodyQueryResults | null | undefined,
  orgId: string | null | undefined,
): T[] {
  const byId = new Map<string, BodyQueryResult>();
  for (const result of results ?? []) {
    if (result && result.resourceIdentity.org === (orgId ?? "")) {
      byId.set(result.request_id, result);
    }
  }
  return (rawRows ?? []).map((rawRow) => {
    const match = byId.get(rawRow.request_id);
    const currentKey = requestBodyIdentityKey(
      requestBodyIdentity(rawRow as RequestBodyIdentityRow, orgId),
    );
    if (match && currentKey === resourceIdentityKey(match.resourceIdentity)) {
      // Latest raw metadata/order wins; only the body fields come from the
      // successful result.
      return {
        ...rawRow,
        request_body: match.request_body,
        response_body: match.response_body,
      };
    }
    return rawRow;
  });
}
