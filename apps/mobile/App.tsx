import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLearner } from "./src/useLearner";
import { supabase } from "./src/backend";
import { Auth } from "./src/Auth";
import { Lesson } from "./src/Lesson";
import { Button, Card, Loading, colors, s } from "./src/ui";
import { CourseMap } from "./src/CourseMap";
import { BetaHome } from "./src/BetaHome";
import { BrandTransition } from "./src/BrandTransition";
import { Orientation } from "./src/Orientation";
import { AppIntro } from "./src/AppIntro";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function App() {
  const learner = useLearner();
  const [screen, setScreen] = useState<
    "course" | "map" | "profile" | "lesson" | "auth" | "orientation"
  >("course");
  const [authReturn, setAuthReturn] = useState<"course" | "lesson">("course");
  const [signingOut, setSigningOut] = useState(false);
  const [brandTransitioning, setBrandTransitioning] = useState(false);
  const [orientationSeen, setOrientationSeen] = useState<boolean | null>(null);
  const [introVisible, setIntroVisible] = useState(true);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem("expresate_mobile_orientation_v1")
      .then((value) => {
        if (active) setOrientationSeen(value === "seen");
      })
      .catch(() => {
        if (active) setOrientationSeen(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = (back: "course" | "lesson" = "course") => {
    setAuthReturn(back);
    setScreen("auth");
  };
  const openLesson000 = () => {
    if (brandTransitioning) return;
    setBrandTransitioning(true);
  };
  const replayOrientation = async () => {
    try {
      await AsyncStorage.removeItem("expresate_mobile_orientation_v1");
    } catch {
      // Development replay can still open if storage reset fails.
    }
    setOrientationSeen(false);
    setScreen("orientation");
  };
  // Keep the lesson mounted while authentication is shown, preserving answers.
  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={s.screen}
        edges={
          screen === "lesson" || screen === "orientation"
            ? []
            : ["top", "right", "bottom", "left"]
        }
      >
        <StatusBar style="dark" />
        {learner.starting ? (
          <Loading />
        ) : (
          <>
            {(screen === "lesson" ||
              (screen === "auth" && authReturn === "lesson")) && (
              <View
                style={{
                  flex: 1,
                  display: screen === "lesson" ? "flex" : "none",
                }}
              >
                <Lesson
                  close={() => setScreen("course")}
                  login={() => login("lesson")}
                  signedIn={!!learner.session}
                  completed={
                    !!learner.progress.lessons?.["lesson-000-alphabet"]?.done
                  }
                  pending={learner.pending}
                  syncError={learner.error}
                  complete={() => learner.complete("lesson-000-alphabet", 10)}
                />
              </View>
            )}
            {screen === "auth" && <Auth close={() => setScreen(authReturn)} />}
            {screen === "orientation" && (
              <Orientation
                onCancel={() => setScreen("course")}
                onComplete={async () => {
                  setOrientationSeen(true);
                  try {
                    await AsyncStorage.setItem(
                      "expresate_mobile_orientation_v1",
                      "seen",
                    );
                  } catch {
                    // The tutorial can still complete if local persistence fails.
                  }
                  setScreen("lesson");
                }}
              />
            )}
            {(screen === "course" || screen === "map" || screen === "profile") && (
              <>
                <ScrollView
                  contentContainerStyle={
                    screen === "course" ? { flexGrow: 1 } : s.content
                  }
                  refreshControl={
                    <RefreshControl
                      refreshing={learner.busy}
                      onRefresh={learner.refresh}
                      tintColor={colors.blue}
                    />
                  }
                >
                  {screen === "course" ? (
                    <BetaHome
                      completed={
                        !!learner.progress.lessons?.["lesson-000-alphabet"]?.done
                      }
                      orientationSeen={orientationSeen}
                      onOpenLesson={openLesson000}
                      onReplayOrientation={replayOrientation}
                      onOpenAccount={() => setScreen("profile")}
                      onOpenMap={() => setScreen("map")}
                    />
                  ) : screen === "map" ? (
                    <>
                      <Text style={s.eyebrow}>EXPRÉSATE</Text>
                      <Text style={s.title}>Tu recorrido</Text>
                      <Text style={s.muted}>
                        Aquí aparece la ruta completa después de conocer la primera lección.
                      </Text>
                      <CourseMap
                        progress={learner.progress}
                        premium={learner.premium}
                        stats={learner.stats}
                        onOpenLesson000={openLesson000}
                        onReplayOrientation={replayOrientation}
                      />
                    </>
                  ) : (
                    <>
                      <Text style={s.eyebrow}>EXPRÉSATE</Text>
                      <Text style={s.title}>Tu cuenta</Text>
                      {learner.error ? (
                        <Card>
                          <Text style={s.error}>{learner.error}</Text>
                          <Button
                            secondary
                            title="Reintentar sincronización"
                            onPress={learner.refresh}
                            disabled={learner.busy}
                          />
                        </Card>
                      ) : null}
                      {learner.pending ? (
                        <Text style={s.muted}>
                          Hay un resultado guardado en este teléfono pendiente de sincronizar.
                        </Text>
                      ) : null}
                      <Card>
                      <Text style={s.heading}>
                        {!learner.session
                          ? "Modo exploración"
                          : learner.premium === null
                            ? "Premium: sin verificar"
                            : learner.premium
                              ? "Exprésate Premium"
                              : "Cuenta gratuita"}
                      </Text>
                      <Text style={s.body}>
                        Tu cuenta comparte lecciones completadas, XP y racha con
                        Exprésate Web.
                      </Text>
                      <Text style={s.muted}>
                        La primera lección es gratuita. Las compras y el acceso
                        a lecciones Premium todavía no están habilitados en
                        móvil.
                      </Text>
                      {learner.session ? (
                        <>
                          <Button
                            secondary
                            title={
                              learner.busy
                                ? "Actualizando…"
                                : "Actualizar desde la cuenta"
                            }
                            onPress={learner.refresh}
                            disabled={learner.busy}
                          />
                          <Button
                            title={signingOut ? "Cerrando…" : "Cerrar sesión"}
                            disabled={signingOut || learner.busy}
                            onPress={async () => {
                              setSigningOut(true);
                              try {
                                const { error } = await supabase.auth.signOut({
                                  scope: "local",
                                });
                                if (error) throw error;
                                setScreen("course");
                              } catch (e: any) {
                                Alert.alert(
                                  "No se pudo cerrar sesión",
                                  e.message,
                                );
                              } finally {
                                setSigningOut(false);
                              }
                            }}
                          />
                        </>
                      ) : (
                        <Button
                          title="Iniciar sesión"
                          onPress={() => login()}
                        />
                      )}
                    </Card>
                    </>
                  )}
                </ScrollView>
                {screen !== "course" ? (
                <View
                  style={[
                    s.row,
                    {
                      padding: 12,
                      borderTopWidth: 1,
                      borderTopColor: colors.line,
                      backgroundColor: colors.white,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Curso"
                      secondary={screen === "profile"}
                      onPress={() => setScreen("course")}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Mi cuenta"
                      secondary={screen !== "profile"}
                      onPress={() => setScreen("profile")}
                    />
                  </View>
                </View>
                ) : null}
              </>
            )}
          </>
        )}
      </SafeAreaView>
      <BrandTransition
        visible={brandTransitioning}
        onCovered={() =>
          setScreen(orientationSeen === true ? "lesson" : "orientation")
        }
        onFinished={() => setBrandTransitioning(false)}
      />
      <AppIntro
        visible={introVisible}
        onPrepareNext={() => {
          setScreen(orientationSeen === true ? "course" : "orientation");
        }}
        onFinished={() => setIntroVisible(false)}
      />
    </SafeAreaProvider>
  );
}
