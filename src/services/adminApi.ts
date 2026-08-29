import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const ADMIN_URL =
  import.meta.env.VITE_ADMIN_URL ||
  "https://script.google.com/macros/s/AKfycbzBao4_TyAme4m-OLT_xOjlO778Ip1QNJX8sOGDiJvaop-9tE_eiRF51O3Bb7VPB63xWg/exec";

export interface AdminPayload {
  readonly id?: string;
  readonly name?: string;
  readonly parentId?: string;
  readonly status?: string;
  readonly preliMarks?: string;
  readonly comments?: string;
  readonly startedDate?: string;
  readonly targetToCompleteDate?: string;
  readonly completedDate?: string;
  readonly links?: readonly unknown[];
  readonly is_subject?: boolean;
  readonly id1?: string;
  readonly id2?: string;
}

export interface AdminRequest {
  readonly action: "CREATE" | "UPDATE" | "DELETE" | "SWAP";
  readonly payload: AdminPayload;
}

export interface AdminResponse {
  readonly status: "success" | "error";
  readonly action?: string;
  readonly message?: string;
}

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: fetchBaseQuery({ baseUrl: "" }),
  endpoints: (builder) => ({
    executeAdminAction: builder.mutation<AdminResponse, AdminRequest>({
      query: (body) => ({
        url: ADMIN_URL,
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
      }),
      transformResponse: (response: AdminResponse) => {
        if (response && response.status === "error") {
          throw new Error(response.message || "Failed to execute action on Google Sheet.");
        }
        return response;
      },
    }),
  }),
});

export const { useExecuteAdminActionMutation } = adminApi;
