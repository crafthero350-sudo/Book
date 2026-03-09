import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type FollowStatus = "none" | "following" | "requested";

export function useFollow(targetUserId: string | null) {
  const { user } = useAuth();
  const [status, setStatus] = useState<FollowStatus>("none");
  const [loading, setLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isPrivate, setIsPrivate] = useState(false);

  const refresh = useCallback(async () => {
    if (!targetUserId) return;

    const [followersRes, followingRes, profileRes] = await Promise.all([
      supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", targetUserId),
      supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", targetUserId),
      supabase.from("profiles").select("is_private").eq("user_id", targetUserId).single(),
    ]);

    setFollowersCount(followersRes.count || 0);
    setFollowingCount(followingRes.count || 0);
    setIsPrivate(profileRes.data?.is_private || false);

    if (!user || user.id === targetUserId) {
      setStatus("none");
      return;
    }

    const { data: followData } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId)
      .maybeSingle();

    if (followData) {
      setStatus("following");
      return;
    }

    const { data: requestData } = await supabase
      .from("follow_requests")
      .select("id, status")
      .eq("requester_id", user.id)
      .eq("target_id", targetUserId)
      .eq("status", "pending")
      .maybeSingle();

    setStatus(requestData ? "requested" : "none");
  }, [targetUserId, user]);

  useEffect(() => { refresh(); }, [refresh]);

  const toggleFollow = async () => {
    if (!user || !targetUserId || loading) return;
    setLoading(true);

    try {
      if (status === "following") {
        await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetUserId);
        setStatus("none");
      } else if (status === "requested") {
        await supabase.from("follow_requests").delete().eq("requester_id", user.id).eq("target_id", targetUserId);
        setStatus("none");
      } else {
        if (isPrivate) {
          await supabase.from("follow_requests").insert({ requester_id: user.id, target_id: targetUserId });
          setStatus("requested");
        } else {
          await supabase.from("follows").insert({ follower_id: user.id, following_id: targetUserId });
          setStatus("following");
        }
      }
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  return { status, loading, toggleFollow, followersCount, followingCount, isPrivate, refresh };
}
