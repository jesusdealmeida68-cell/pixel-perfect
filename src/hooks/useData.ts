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
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .maybeSingle();
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

export function useUid_() {
  return useUid();
}
