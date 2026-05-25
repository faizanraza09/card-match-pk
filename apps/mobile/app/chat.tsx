import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, radii, spacing, typography } from "@/theme";

// Mobile chat surface that talks to the SAME /api/chat endpoint as the web app.
// This keeps a single LLM backend for both clients.
const CHAT_ENDPOINT = `${(process.env.EXPO_PUBLIC_DATA_ORIGIN || "https://konsacard.pk").replace(/\/$/, "")}/api/chat`;

interface Msg {
  role: "user" | "assistant" | "system";
  content: string;
}

const QUICK_QUESTIONS = [
  "Best card for Karachi?",
  "No credit card options?",
  "Highest discount %?",
  "Best low-fee options?",
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi — ask me anything about cards, restaurants, or discounts. I look at the same offers and requirements as the rest of the app.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const listRef = useRef<FlatList<Msg>>(null);

  const send = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t || loading) return;
      const next: Msg[] = [...messages, { role: "user", content: t }];
      setMessages(next);
      setInput("");
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(CHAT_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: next.map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const txt = await res.text();
        // Web /api/chat may stream or return JSON; we try JSON first, fall back to raw text.
        let reply = "";
        try {
          const json = JSON.parse(txt);
          reply = json.reply || json.content || json.message || txt;
        } catch {
          reply = txt;
        }
        setMessages((m) => [...m, { role: "assistant", content: reply }]);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
      }
    },
    [messages, loading]
  );

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => <Bubble m={item} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.quickRow}>
            {QUICK_QUESTIONS.map((q) => (
              <Pressable key={q} style={styles.quick} onPress={() => send(q)}>
                <Text style={styles.quickText}>{q}</Text>
              </Pressable>
            ))}
          </View>
        }
      />
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.brand} />
          <Text style={styles.loadingText}>Thinking…</Text>
        </View>
      ) : null}
      {err ? <Text style={styles.err}>{err}</Text> : null}
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Ask a question…"
          placeholderTextColor={colors.textDim}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => send(input)}
          editable={!loading}
          returnKeyType="send"
        />
        <Pressable
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnOff]}
          onPress={() => send(input)}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendBtnText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ m }: { m: Msg }) {
  const mine = m.role === "user";
  return (
    <View style={[styles.bubbleWrap, mine ? styles.right : styles.left]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.bubbleText, mine ? styles.bubbleTextMine : null]}>{m.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg, paddingBottom: 80 },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.md,
  },
  quick: {
    backgroundColor: colors.bgElev,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  quickText: { color: colors.text, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  bubbleWrap: { marginBottom: spacing.sm },
  left: { alignItems: "flex-start" },
  right: { alignItems: "flex-end" },
  bubble: { padding: spacing.sm, borderRadius: radii.lg, maxWidth: "85%" },
  bubbleMine: { backgroundColor: colors.brand, borderTopRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.bgElev, borderTopLeftRadius: 4 },
  bubbleText: { color: colors.text, fontSize: typography.size.md, lineHeight: 20 },
  bubbleTextMine: { color: colors.textOnBrand },
  loading: { flexDirection: "row", alignItems: "center", padding: spacing.sm },
  loadingText: { color: colors.textMuted, marginLeft: spacing.xs },
  err: { color: colors.red, padding: spacing.sm, fontSize: typography.size.sm },
  composer: {
    flexDirection: "row",
    padding: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bgElev,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgSubtle,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: typography.size.md,
    color: colors.text,
  },
  sendBtn: {
    marginLeft: spacing.xs,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
    backgroundColor: colors.brand,
    borderRadius: radii.pill,
  },
  sendBtnOff: { opacity: 0.5 },
  sendBtnText: { color: colors.textOnBrand, fontWeight: typography.weight.bold },
});
