import React, { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  RefreshControl,
  Alert,
  Image,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLearner } from "./src/useLearner";
import { supabase } from "./src/backend";
import { Auth } from "./src/Auth";
import { Lesson } from "./src/Lesson";
import { Button, Card, Loading, colors, s } from "./src/ui";

export default function App() {
  const learner = useLearner();
  const [screen, setScreen] = useState<
    "course" | "profile" | "lesson" | "auth"
  >("course");
  const [authReturn, setAuthReturn] = useState<"course" | "lesson">("course");
  const [signingOut, setSigningOut] = useState(false);
  const login = (back: "course" | "lesson" = "course") => {
    setAuthReturn(back);
    setScreen("auth");
  };
  // Keep the lesson mounted while authentication is shown, preserving answers.
  return (
    <SafeAreaProvider>
      <SafeAreaView style={s.screen}>
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
            {(screen === "course" || screen === "profile") && (
              <>
                <ScrollView
                  contentContainerStyle={s.content}
                  refreshControl={
                    <RefreshControl
                      refreshing={learner.busy}
                      onRefresh={learner.refresh}
                      tintColor={colors.blue}
                    />
                  }
                >
                  <Text style={s.eyebrow}>EXPRÉSATE</Text>
                  <Text style={s.title}>
                    {screen === "course"
                      ? "Tu inglés empieza aquí."
                      : "Tu cuenta"}
                  </Text>
                  <Text style={s.muted}>
                    {learner.session
                      ? learner.session.user.email
                      : "Explora la primera clase. Inicia sesión para guardar tu progreso."}
                  </Text>
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
                      Hay un resultado guardado en este teléfono pendiente de
                      sincronizar.
                    </Text>
                  ) : null}
                  <View style={s.row}>
                    {[
                      [learner.stats.xp, "XP"],
                      [learner.stats.streak, "días de racha"],
                      [learner.stats.completed, "completadas"],
                    ].map(([value, label]) => (
                      <View
                        key={label}
                        style={{
                          flex: 1,
                          minWidth: 86,
                          paddingVertical: 17,
                          paddingHorizontal: 10,
                          backgroundColor: colors.pale,
                          borderRadius: 18,
                        }}
                      >
                        <Text style={s.heading}>{value}</Text>
                        <Text style={s.muted}>{label}</Text>
                      </View>
                    ))}
                  </View>
                  {screen === "course" ? (
                    <>
                      <Card>
                        <Text style={s.eyebrow}>MÓDULO 0 · FUNDAMENTOS</Text>
                        <Image
                          source={require("../../assets/characters/sofia/greeting.webp")}
                          style={{ width: "100%", height: 180 }}
                          resizeMode="contain"
                        />
                        <Text style={s.heading}>000 · El alfabeto</Text>
                        <Text style={s.body}>
                          Conoce a Sofía. Escucha las letras y aprende a
                          deletrear información importante.
                        </Text>
                        <Text style={s.muted}>
                          A–Z · audio · práctica · 10 XP
                        </Text>
                        <Button
                          title={
                            learner.progress.lessons?.["lesson-000-alphabet"]
                              ?.done
                              ? "Practicar de nuevo"
                              : "Empezar lección"
                          }
                          onPress={() => setScreen("lesson")}
                        />
                      </Card>
                      <Card>
                        <Text style={s.heading}>001 · Sonidos clave</Text>
                        <Text style={s.muted}>
                          SH / CH / TH y pares mínimos. Esta lección sigue
                          disponible en la web; su versión nativa aún está en
                          preparación.
                        </Text>
                      </Card>
                      {!learner.session && (
                        <Button
                          secondary
                          title="Iniciar sesión / Crear cuenta"
                          onPress={() => login()}
                        />
                      )}
                    </>
                  ) : (
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
                  )}
                </ScrollView>
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
                      secondary={screen !== "course"}
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
              </>
            )}
          </>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
