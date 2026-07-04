import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { uploadPhoto, signedUrl } from "../lib";

export default function Profile({ user, onFechar }) {
  const [nome, setNome] = useState("");
  const [avatarPath, setAvatarPath] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("nome, avatar_path")
        .eq("id", user.id)
        .single();
      if (data) {
        setNome(data.nome || "");
        setAvatarPath(data.avatar_path);
        if (data.avatar_path) setAvatarUrl(await signedUrl(data.avatar_path));
      }
    })();
  }, [user.id]);

  async function trocarAvatar(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setSalvando(true);
    try {
      const path = await uploadPhoto(f, user.id);
      await supabase.from("profiles").update({ avatar_path: path }).eq("id", user.id);
      setAvatarPath(path);
      setAvatarUrl(await signedUrl(path));
      setMsg("Foto atualizada.");
    } catch {
      setMsg("Erro ao enviar foto.");
    }
    setSalvando(false);
  }

  async function salvarNome() {
    setSalvando(true);
    const { error } = await supabase
      .from("profiles")
      .update({ nome: nome.trim() })
      .eq("id", user.id);
    setMsg(error ? "Erro ao salvar." : "Nome salvo.");
    setSalvando(false);
  }

  return (
    <div className="px-6 pt-8 pb-24 max-w-md mx-auto animate-rise">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-display text-3xl font-semibold">Perfil</h2>
        <button onClick={onFechar} className="text-muted text-sm">
          Fechar
        </button>
      </div>

      <div className="flex flex-col items-center mb-8">
        <label className="cursor-pointer">
          <input type="file" accept="image/*" onChange={trocarAvatar} className="hidden" />
          <div className="w-28 h-28 rounded-full overflow-hidden bg-white border border-line flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-muted text-sm">Foto</span>
            )}
          </div>
        </label>
        <span className="text-muted text-xs mt-2">Toque para trocar</span>
      </div>

      <label className="text-sm text-muted">Seu nome</label>
      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        className="w-full mt-1 bg-white border border-line rounded-2xl px-4 py-3.5 outline-none focus:border-terracotta transition-colors"
      />

      {msg && <p className="text-teal text-sm mt-3">{msg}</p>}

      <button
        onClick={salvarNome}
        disabled={salvando}
        className="w-full mt-5 bg-ink text-paper rounded-2xl py-3.5 font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
      >
        Salvar
      </button>

      <button
        onClick={() => supabase.auth.signOut()}
        className="w-full mt-3 text-muted text-sm py-2"
      >
        Sair
      </button>
    </div>
  );
}
