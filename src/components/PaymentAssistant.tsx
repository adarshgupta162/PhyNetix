import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Receipt, Send, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };
const suggestions = ["Why is my payment pending?", "Was I charged for a failed payment?", "Which courses have I paid for?"];

export function PaymentAssistant() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const ask = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput(""); setError(null); setBusy(true);
    abort.current = new AbortController();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payment-assistant`, {
        method: "POST", signal: abort.current.signal,
        headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok || !res.body) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || "The assistant is unavailable right now.");
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "", answer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          try {
            const ev = JSON.parse(line.slice(5).trim());
            if (ev.type === "response.output_text.delta") {
              answer += ev.delta;
              setMessages([...next, { role: "assistant", content: answer }]);
            } else if (ev.type === "response.failed" || ev.type === "error") {
              throw new Error(ev.response?.error?.message || ev.message || "The assistant could not answer.");
            }
          } catch (e) { if (e instanceof Error && !(e instanceof SyntaxError)) throw e; }
        }
      }
      if (!answer) throw new Error("The assistant could not answer this question.");
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
      setMessages((m) => (m[m.length - 1]?.content ? m : m.slice(0, -1)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5 text-primary" />Ask about your payments</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => <Button key={s} variant="outline" size="sm" onClick={() => ask(s)}>{s}</Button>)}
          </div>
        )}
        <div className="space-y-3">
          {messages.map((m, i) => m.role === "user"
            ? <div key={i} className="ml-auto w-fit max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">{m.content}</div>
            : <div key={i} className="prose prose-sm max-w-none text-foreground dark:prose-invert">{m.content ? <ReactMarkdown>{m.content}</ReactMarkdown> : <span className="text-muted-foreground">Checking your payments…</span>}</div>)}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
          <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. My money was debited but I'm not enrolled"
            className="min-h-[44px] resize-none" rows={1}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input); } }} />
          {busy
            ? <Button type="button" size="icon" variant="outline" onClick={() => abort.current?.abort()} aria-label="Stop"><Square className="h-4 w-4" /></Button>
            : <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Send"><Send className="h-4 w-4" /></Button>}
        </form>
      </CardContent>
    </Card>
  );
}
