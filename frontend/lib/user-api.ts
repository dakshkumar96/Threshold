"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useMemo } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export type SavedSearch = {
  id: number;
  role: string;
  experience: string | null;
  min_salary: number | null;
  created_at: string;
};

export type UserPreferences = {
  user_id?: string;
  default_experience: string | null;
  locations: string | null;
  email_alerts: boolean;
  cv_filename: string | null;
  updated_at?: string | null;
};

export type LastMatch = {
  role?: string;
  score?: number | null;
  updated_at?: string;
  gaps?: { skill: string; frequency_pct?: number; ease_weeks?: number }[];
  sponsors?: {
    company: string;
    title?: string;
    stability_band?: string | null;
    sponsor_confidence?: string | null;
  }[];
  top_companies?: { company: string; jobs?: number }[];
  requirement_frequencies?: { skill: string; share_pct: number }[];
  where_you_are?: string | null;
  jobs_total?: number | null;
  sponsor_count?: number | null;
};

function lastMatchFromSession(): LastMatch | null {
  try {
    const raw = sessionStorage.getItem("sponsor_signal_results");
    if (!raw) return null;
    const data = JSON.parse(raw) as {
      role?: string;
      score?: number | null;
      gaps?: LastMatch["gaps"];
      skills_to_learn?: LastMatch["gaps"];
      sponsors?: LastMatch["sponsors"];
      requirement_frequencies?: LastMatch["requirement_frequencies"];
      where_you_are?: string | null;
      jobs_total?: number;
    };
    return {
      role: data.role,
      score: data.score,
      gaps: data.skills_to_learn || data.gaps || [],
      sponsors: (data.sponsors || []).slice(0, 5),
      requirement_frequencies: data.requirement_frequencies || [],
      where_you_are: data.where_you_are,
      jobs_total: data.jobs_total,
    };
  } catch {
    return null;
  }
}

export function useUserApi() {
  const { getToken, isSignedIn } = useAuth();

  const apiFetch = useCallback(
    async (path: string, init?: RequestInit): Promise<Response> => {
      const headers: Record<string, string> = {
        ...(init?.headers as Record<string, string> | undefined),
      };
      if (isSignedIn) {
        try {
          const token = await getToken();
          if (token) headers.Authorization = `Bearer ${token}`;
        } catch {
          /* ignore */
        }
      }
      if (init?.body && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }
      return fetch(`${API_URL}${path}`, { ...init, headers });
    },
    [getToken, isSignedIn],
  );

  const getSavedSearches = useCallback(async (): Promise<SavedSearch[]> => {
    const res = await apiFetch("/me/saved-searches");
    if (!res.ok) return [];
    const data = (await res.json()) as { items: SavedSearch[] };
    return data.items || [];
  }, [apiFetch]);

  const saveSearch = useCallback(
    async (input: {
      role: string;
      experience?: string | null;
      min_salary?: number | null;
    }): Promise<SavedSearch | null> => {
      const res = await apiFetch("/me/saved-searches", {
        method: "POST",
        body: JSON.stringify(input),
      });
      if (!res.ok) return null;
      return res.json();
    },
    [apiFetch],
  );

  const deleteSavedSearch = useCallback(
    async (id: number): Promise<boolean> => {
      const res = await apiFetch(`/me/saved-searches/${id}`, { method: "DELETE" });
      return res.ok;
    },
    [apiFetch],
  );

  const getPreferences = useCallback(async (): Promise<UserPreferences | null> => {
    const res = await apiFetch("/me/preferences");
    if (!res.ok) {
      return {
        default_experience: "mid",
        locations: "",
        email_alerts: false,
        cv_filename: null,
      };
    }
    return res.json();
  }, [apiFetch]);

  const putPreferences = useCallback(
    async (body: Partial<UserPreferences>): Promise<UserPreferences | null> => {
      const res = await apiFetch("/me/preferences", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      if (!res.ok) return null;
      return res.json();
    },
    [apiFetch],
  );

  const getLastMatch = useCallback(async (): Promise<LastMatch | null> => {
    const res = await apiFetch("/me/last-match");
    if (res.ok) {
      const data = await res.json();
      if (data?.role) return data as LastMatch;
    }
    return lastMatchFromSession();
  }, [apiFetch]);

  const putLastMatch = useCallback(
    async (body: LastMatch): Promise<void> => {
      await apiFetch("/me/last-match", {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
    [apiFetch],
  );

  return useMemo(
    () => ({
      getSavedSearches,
      saveSearch,
      deleteSavedSearch,
      getPreferences,
      putPreferences,
      getLastMatch,
      putLastMatch,
    }),
    [
      getSavedSearches,
      saveSearch,
      deleteSavedSearch,
      getPreferences,
      putPreferences,
      getLastMatch,
      putLastMatch,
    ],
  );
}

export async function checkSponsor(q: string): Promise<{
  query: string;
  match: {
    register_name: string;
    company_key: string;
    fuzzy_score: number;
    confidence: string;
    verdict: string;
  } | null;
  note: string | null;
  candidates?: { company_key: string; fuzzy_score: number }[];
}> {
  const res = await fetch(`${API_URL}/sponsor-check?q=${encodeURIComponent(q)}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text.slice(0, 200) || `Error ${res.status}`);
  }
  return res.json();
}
