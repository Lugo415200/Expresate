import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./backend";
const core = require("../../../shared/progress-core");

export function useLearner() {
  const [session, setSession] = useState<Session | null>(null);
  const [starting, setStarting] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(core.empty());
  const [premium, setPremium] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const active = useRef<string | null>(null);
  const revision = useRef(0);
  const refresh = useCallback(async () => {
    const id = active.current;
    if (!id) return;
    const ticket = ++revision.current;
    const current = () => active.current === id && revision.current === ticket;
    setBusy(true);
    setError("");
    try {
      const key = `expresate:pending:${id}`;
      const serialized = await AsyncStorage.getItem(key);
      if (!current()) return;
      setPending(!!serialized);
      let next;
      if (serialized) {
        next = await core.sync(supabase, id, JSON.parse(serialized), current);
        if (!current()) return;
        // A newer completion may have arrived while this write was in flight.
        if ((await AsyncStorage.getItem(key)) === serialized)
          await AsyncStorage.removeItem(key);
      } else {
        const result = await supabase
          .from("user_progress")
          .select("progress")
          .eq("user_id", id)
          .maybeSingle();
        if (result.error) throw result.error;
        next = result.data?.progress || core.empty();
      }
      if (!current()) return;
      setProgress(next);
      setPending(!!(await AsyncStorage.getItem(key)));
      const profile = await supabase
        .from("profiles")
        .select("subscription_status,current_period_end")
        .eq("id", id)
        .maybeSingle();
      if (!current()) return;
      if (profile.error) {
        setPremium(null);
        throw new Error("Progreso sincronizado. No pudimos consultar Premium.");
      }
      setPremium(
        profile.data?.subscription_status === "active" &&
          new Date(profile.data.current_period_end).getTime() > Date.now(),
      );
    } catch (e: any) {
      if (current())
        setError(e.message || "No se pudo sincronizar. Vuelve a intentarlo.");
    } finally {
      if (current()) setBusy(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let authEvent = false;
    const accept = (value: Session | null) => {
      if (!mounted) return;
      const id = value?.user.id || null;
      if (active.current !== id) {
        revision.current++;
        active.current = id;
        setProgress(core.empty());
        setPremium(null);
        setPending(false);
        setError("");
        setBusy(false);
      }
      setSession(value);
      setStarting(false);
    };
    const { data } = supabase.auth.onAuthStateChange((_event, value) => {
      authEvent = true;
      accept(value);
    });
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!authEvent) accept(data.session);
        if (error && mounted) {
          setError(error.message);
          setStarting(false);
        }
      })
      .catch((e) => {
        if (mounted) {
          setError(e.message);
          setStarting(false);
        }
      });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (session?.user.id) void refresh();
  }, [session?.user.id, refresh]);
  useEffect(() => {
    supabase.auth.startAutoRefresh();
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        supabase.auth.startAutoRefresh();
        void refresh();
      } else supabase.auth.stopAutoRefresh();
    });
    return () => {
      listener.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, [refresh]);
  async function complete(id: string, xp: number) {
    const userId = active.current;
    if (!userId) throw new Error("Inicia sesión para guardar tu progreso.");
    const key = `expresate:pending:${userId}`;
    const stored = await AsyncStorage.getItem(key);
    const delta = core.complete(
      stored ? JSON.parse(stored) : core.empty(),
      id,
      xp,
    );
    await AsyncStorage.setItem(key, JSON.stringify(delta));
    if (active.current !== userId) return;
    setPending(true);
    await refresh();
  }
  return {
    session,
    starting,
    busy,
    progress,
    premium,
    error,
    pending,
    refresh,
    complete,
    stats: core.stats(progress),
  };
}
