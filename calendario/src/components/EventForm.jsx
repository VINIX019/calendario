import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { uploadPhoto, removePhoto, signedUrl, paraInputLocal } from "../lib";

// Modo duplo: sem `evento` => criar; com `evento` => editar.
// Editar cobre o "adicionar/trocar/remover foto depois".
export default function EventForm({ user, evento, onSalvo, onCancelar }) {
  const editando = Boolean(evento);

  const [titulo, setTitulo] = useState(evento?.titulo || "");
  const [descricao, setDescricao] = useState(evento?.descricao || "");
  const [data, setData] = useState(paraInputLocal(evento?.data));
  const [arquivo, setArquivo] = useState(null);      // nova foto escolhida
  const [preview, setPreview] = useState(null);      // URL exibida na prévia
  const [removerFoto, setRemoverFoto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  // Ao editar um evento que já tem foto, busca a URL assinada pra mostrar a prévia.
  useEffect(() => {
    if (editando && evento.foto_path) {
      signedUrl(evento.foto_path).then((u) => u && setPreview(u));
    }
  }, [editando, evento]);

  function escolherFoto(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setArquivo(f);
    setPreview(URL.createObjectURL(f));
    setRemoverFoto(false);
  }

  function tirarFoto() {
    setArquivo(null);
    setPreview(null);
    setRemoverFoto(true);
  }

  async function salvar() {
    if (!titulo.trim() || !data) {
      setErro("Título e data são obrigatórios.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      // resolve o foto_path final e limpa arquivo antigo do storage
      let foto_path = evento?.foto_path ?? null;
      if (arquivo) {
        const novo = await uploadPhoto(arquivo, user.id);
        if (evento?.foto_path) await removePhoto(evento.foto_path); // remove a antiga
        foto_path = novo;
      } else if (removerFoto && evento?.foto_path) {
        await removePhoto(evento.foto_path);
        foto_path = null;
      }

      const payload = {
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        data: new Date(data).toISOString(),
        foto_path,
      };

      if (editando) {
        const { error } = await supabase
          .from("eventos")
          .update(payload)
          .eq("id", evento.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("eventos")
          .insert({ ...payload, created_by: user.id });
        if (error) throw error;
      }
      onSalvo();
    } catch (err) {
      setErro("Não deu pra salvar. " + (err.message || ""));
      setSalvando(false);
    }
  }

  return (
    <div className="px-6 pt-8 pb-24 max-w-md mx-auto animate-rise">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-display text-3xl font-semibold">
          {editando ? "Editar evento" : "Novo evento"}
        </h2>
        <button onClick={onCancelar} className="text-muted text-sm">
          Cancelar
        </button>
      </div>

      <div className="space-y-4">
        <input
          placeholder="O que vai rolar?"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-full bg-white border border-line rounded-2xl px-4 py-3.5 outline-none focus:border-terracotta transition-colors"
        />
        <input
          type="datetime-local"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="w-full bg-white border border-line rounded-2xl px-4 py-3.5 outline-none focus:border-terracotta transition-colors text-ink"
        />
        <textarea
          placeholder="Detalhes (opcional)"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={3}
          className="w-full bg-white border border-line rounded-2xl px-4 py-3.5 outline-none focus:border-terracotta transition-colors resize-none"
        />

        <label className="block">
          <span className="sr-only">Foto</span>
          <input type="file" accept="image/*" onChange={escolherFoto} className="hidden" />
          <div className="cursor-pointer border border-dashed border-line rounded-2xl overflow-hidden bg-white">
            {preview ? (
              <img src={preview} alt="prévia" className="w-full h-48 object-cover" />
            ) : (
              <div className="h-24 flex items-center justify-center text-muted text-sm">
                {editando ? "+ Adicionar / trocar foto" : "+ Adicionar foto"}
              </div>
            )}
          </div>
        </label>

        {preview && (
          <button
            onClick={tirarFoto}
            className="text-muted text-xs underline underline-offset-4"
          >
            Remover foto
          </button>
        )}
      </div>

      {erro && <p className="text-terracotta text-sm mt-4">{erro}</p>}

      <button
        onClick={salvar}
        disabled={salvando}
        className="w-full mt-6 bg-ink text-paper rounded-2xl py-3.5 font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
      >
        {salvando ? "Salvando…" : editando ? "Salvar alterações" : "Salvar evento"}
      </button>
    </div>
  );
}