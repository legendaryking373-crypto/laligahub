import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  display_name: string | null;
  favorite_team_id: number | null;
  favorite_team_name: string | null;
  favorite_team_logo: string | null;
  favorite_player_id: number | null;
  favorite_player_name: string | null;
  favorite_player_photo: string | null;
  onboarded: boolean;
  notify_goals: boolean;
  notify_kickoff: boolean;
  notify_news: boolean;
}

async function loadProfile(): Promise<Profile | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const existing = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (existing.data) return existing.data as Profile;

  const metadata = user.user_metadata as { full_name?: string; name?: string };
  const created = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      display_name: metadata.full_name ?? metadata.name ?? user.email ?? null,
    })
    .select("*")
    .single();

  if (created.error) throw created.error;
  return created.data as Profile;
}

export function useProfile() {
  return useQuery({ queryKey: ["profile"], queryFn: loadProfile, staleTime: 1000 * 30 });
}

export function useSaveProfile() {
  const queryClient = useQueryClient();
  return async (patch: Partial<Profile>) => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) throw new Error("Not signed in");
    const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
  };
}
