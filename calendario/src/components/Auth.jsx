import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    setErro("");
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    if (error) setErro("Email ou senha incorretos.");
    setCarregando(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-rise">
        <p className="text-muted text-sm tracking-widest uppercase mb-2">
          Nosso
        </p>
        <h1 className="font-display text-5xl font-semibold leading-none mb-8">
          Calendário
        </h1>

        <div className="space-y-3">
          <input
            type="email"
            inputMode="email"
            autoCapitalize="none"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white border border-line rounded-2xl px-4 py-3.5 text-ink placeholder:text-muted/60 outline-none focus:border-terracotta transition-colors"
          />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && entrar()}
            className="w-full bg-white border border-line rounded-2xl px-4 py-3.5 text-ink placeholder:text-muted/60 outline-none focus:border-terracotta transition-colors"
          />
        </div>

        {erro && <p className="text-terracotta text-sm mt-3">{erro}</p>}

        <button
          onClick={entrar}
          disabled={carregando}
          className="w-full mt-5 bg-ink text-paper rounded-2xl py-3.5 font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {carregando ? "Entrando…" : "Entrar"}
        </button>
      </div>
    </div>
  );
}
