import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type Client = {
  id: string;
  full_name: string;
  company_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  first_contact_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

export type Job = {
  id: string;
  client_id: string | null;
  title: string;
  service: string | null;
  description: string | null;
  start_date: string | null;
  due_date: string | null;
  amount: number;
  paid_amount: number;
  status: string;
  created_at: string;
};

export type DocumentRow = {
  id: string;
  number: string;
  kind: string;
  client_id: string | null;
  job_id: string | null;
  title: string | null;
  service: string | null;
  description: string | null;
  diagnosis: string | null;
  items: { description: string; amount: number }[];
  base_price: number;
  fees: number;
  discount: number;
  other_costs: number;
  total: number;
  payment_method: string | null;
  deadline: string | null;
  conditions: string | null;
  notes: string | null;
  issue_date: string;
  created_at: string;
};

export type Activity = {
  id: string;
  client_id: string | null;
  kind: string;
  message: string;
  amount: number | null;
  created_at: string;
};

export type Company = {
  id?: string;
  name: string;
  owner_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  socials: string | null;
  logo_url: string | null;
  currency: string;
  default_terms: string | null;
};

function useUid() {
  const { user, loading } = useAuth();
  return { uid: user?.id ?? null, loading };
}

export function useClients() {
  const { uid } = useUid();
  return useQuery({
    queryKey: ["clients", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Client[];
    },
  });
}

export function useClient(id: string) {
  const { uid } = useUid();
  return useQuery({
    queryKey: ["client", id, uid],
    enabled: !!uid && !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as unknown as Client | null;
    },
  });
}

export function useJobs() {
  const { uid } = useUid();
  return useQuery({
    queryKey: ["jobs", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Job[];
    },
  });
}

export function useDocuments() {
  const { uid } = useUid();
  return useQuery({
    queryKey: ["documents", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as DocumentRow[];
    },
  });
}

export function useDocument(id: string) {
  const { uid } = useUid();
  return useQuery({
    queryKey: ["document", id, uid],
    enabled: !!uid && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as DocumentRow | null;
    },
  });
}

export function useActivities(limit = 12) {
  const { uid } = useUid();
  return useQuery({
    queryKey: ["activities", uid, limit],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as unknown as Activity[];
    },
  });
}

export function useCompany() {
  const { uid } = useUid();
  return useQuery({
    queryKey: ["company", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("company_settings").select("*").maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as Company | null;
    },
  });
}

export function useLogActivity() {
  const { uid } = useUid();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      message: string;
      kind?: string;
      client_id?: string | null;
      amount?: number | null;
    }) => {
      if (!uid) throw new Error("Sessão expirada");
      const { error } = await supabase.from("activities").insert({
        user_id: uid,
        message: input.message,
        kind: input.kind ?? "nota",
        client_id: input.client_id ?? null,
        amount: input.amount ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["activities"] }),
  });
}

export function useCreateDocument() {
  const { uid } = useUid();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      kind: string;
      client_id?: string | null;
      job_id?: string | null;
      title?: string | null;
      service?: string | null;
      description?: string | null;
      diagnosis?: string | null;
      items?: { description: string; amount: number }[];
      base_price?: number;
      fees?: number;
      discount?: number;
      other_costs?: number;
      total?: number;
      notes?: string | null;
    }) => {
      if (!uid) throw new Error("Sessão expirada");
      const { data, error } = await supabase
        .from("documents")
        .insert({ user_id: uid, ...input })
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as DocumentRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useUid_() {
  return useUid();
}

export function useCreateClient() {
  const { uid } = useUid();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Client> & { full_name: string }) => {
      if (!uid) throw new Error("Sessão expirada");
      const { data, error } = await supabase
        .from("clients")
        .insert({ user_id: uid, ...input })
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as Client;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Client> & { id: string }) => {
      const { data, error } = await supabase
        .from("clients")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as Client;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["client", vars.id] });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useCreateJob() {
  const { uid } = useUid();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Job> & { title: string }) => {
      if (!uid) throw new Error("Sessão expirada");
      const { data, error } = await supabase
        .from("jobs")
        .insert({ user_id: uid, ...input })
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as Job;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useUpdateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Job> & { id: string }) => {
      const { data, error } = await supabase
        .from("jobs")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as Job;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });
}

export function useUpsertCompany() {
  const { uid } = useUid();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Company>) => {
      if (!uid) throw new Error("Sessão expirada");
      const { data, error } = await supabase
        .from("company_settings")
        .upsert({ user_id: uid, ...input }, { onConflict: "user_id" })
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as Company;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["company"] }),
  });
}

export type TableColumn = { id: string; name: string; type: "texto" | "numero" | "moeda" | "data" };
export type TableRow = Record<string, string | number>;
export type CustomTable = {
  id: string;
  title: string;
  columns: TableColumn[];
  rows: TableRow[];
  created_at: string;
  updated_at: string;
};

export function useTables() {
  const { uid } = useUid();
  return useQuery({
    queryKey: ["tables", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_tables")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as CustomTable[];
    },
  });
}

export function useTable(id: string) {
  const { uid } = useUid();
  return useQuery({
    queryKey: ["table", id, uid],
    enabled: !!uid && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_tables")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as CustomTable | null;
    },
  });
}

export function useCreateTable() {
  const { uid } = useUid();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; columns: TableColumn[]; rows: TableRow[] }) => {
      if (!uid) throw new Error("Sessão expirada");
      const { data, error } = await supabase
        .from("custom_tables")
        .insert({ user_id: uid, ...input })
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as CustomTable;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
  });
}

export function useUpdateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: {
      id: string;
      title?: string;
      columns?: TableColumn[];
      rows?: TableRow[];
    }) => {
      const { data, error } = await supabase
        .from("custom_tables")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as CustomTable;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["tables"] });
      qc.invalidateQueries({ queryKey: ["table", vars.id] });
    },
  });
}

export function useDeleteTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_tables").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
  });
}
