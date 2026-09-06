import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
} from "react-native";
import { supabase } from "./backend";
import { Button, Card, s } from "./ui";
export function Auth({ close }: { close: () => void }) {
  const [signup, setSignup] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function submit() {
    setBusy(true);
    setMessage("");
    try {
      const credentials = { email: email.trim(), password };
      const result = signup
        ? await supabase.auth.signUp(credentials)
        : await supabase.auth.signInWithPassword(credentials);
      if (result.error) throw result.error;
      if (result.data.session) close();
      else
        setMessage(
          "Revisa tu correo y confirma tu cuenta. Después vuelve aquí e inicia sesión.",
        );
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.content}
      >
        <Button secondary title="← Volver" onPress={close} disabled={busy} />
        <Text style={s.eyebrow}>EXPRÉSATE · TU CUENTA</Text>
        <Text style={s.title}>
          {signup ? "Empieza tu historia" : "Qué bueno verte"}
        </Text>
        <Text style={s.body}>La misma cuenta, en tu teléfono y en la web.</Text>
        <Card>
          <Text style={s.muted}>Correo electrónico</Text>
          <TextInput
            accessibilityLabel="Correo electrónico"
            style={s.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />
          <Text style={s.muted}>Contraseña</Text>
          <TextInput
            accessibilityLabel="Contraseña"
            style={s.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={signup ? "new-password" : "current-password"}
          />
          {message ? (
            <Text accessibilityLiveRegion="polite" style={s.body}>
              {message}
            </Text>
          ) : null}
          <Button
            title={
              busy ? "Un momento…" : signup ? "Crear cuenta" : "Iniciar sesión"
            }
            disabled={busy || !email.trim() || !password}
            onPress={submit}
          />
          <Button
            secondary
            title={signup ? "Ya tengo cuenta" : "Crear una cuenta gratis"}
            disabled={busy}
            onPress={() => {
              setSignup(!signup);
              setMessage("");
            }}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
