import { $JAWN_API } from "@/lib/clients/jawn";
import { Database } from "@/db/database.types";
import { useOrg } from "../../../../components/layout/org/organizationContext";

type PortalOrg = Database["public"]["Tables"]["organization"]["Row"];
type PortalPageResponse = {
  data?: {
    data?: PortalOrg[];
  };
};

const usePortalPage = () => {
  const org = useOrg();

  const query = $JAWN_API.useQuery(
    "get",
    "/v1/organization/reseller/{resellerId}",
    {
      params: {
        path: {
          resellerId: org?.currentOrg?.id ?? "",
        },
      },
    },
  );

  return {
    ...query,
    data: query.data as PortalPageResponse | undefined,
  };
};

export default usePortalPage;
