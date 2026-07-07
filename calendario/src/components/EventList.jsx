import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { signedUrls, removePhoto, formatarData } from "../lib";

export default function EventList({ user, onEditar }) {
  const [eventos, setEventos] = useState([]);
  const [fotos, setFotos] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [mostrarPassados, setMostrarPassados] = useState(false);

  async function carregar() {
    setCarregando(true);
    // traz as confirmações no mesmo select (join aninhado), com o nome de quem confirmou
    const { data, error } = await supabase
      .from("eventos")
      .select(
        "id, titulo, descricao, data, foto_path, created_by, " +
          "autor:created_by ( nome, avatar_path ), " +
          "confirmacoes ( user_id, profiles:user_id ( nome ) )"
      )
      .order("data", { ascending: true });
    if (!error && data) {
      setEventos(data);
      setFotos(await signedUrls(data.map((e) => e.foto_path).filter(Boolean)));
    }
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  // Marca/desmarca a própria confirmação. Upsert evita quebrar em clique duplo
  // (violação de PK); delete remove. Atualiza só o evento afetado, sem recarregar tudo.
  async function toggleConfirmacao(ev, jaConfirmei) {
    if (jaConfirmei) {
      await supabase
        .from("confirmacoes")
        .delete()
        .eq("evento_id", ev.id)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("confirmacoes")
        .upsert(
          { evento_id: ev.id, user_id: user.id },
          { onConflict: "evento_id,user_id", ignoreDuplicates: true }
        );
    }
    // recarrega o nome de quem confirmou pra este evento
    const { data } = await supabase
      .from("confirmacoes")
      .select("user_id, profiles:user_id ( nome )")
      .eq("evento_id", ev.id);
    setEventos((prev) =>
      prev.map((e) => (e.id === ev.id ? { ...e, confirmacoes: data || [] } : e))
    );
  }

  async function excluir(ev) {
    if (!confirm("Excluir este evento?")) return;
    if (ev.foto_path) await removePhoto(ev.foto_path);
    await supabase.from("eventos").delete().eq("id", ev.id);
    carregar();
  }

  const agora = Date.now();
  const futuros = eventos.filter((e) => new Date(e.data).getTime() >= agora);
  const passados = eventos.filter((e) => new Date(e.data).getTime() < agora).reverse();

  if (carregando) return <div className="px-6 pt-10 text-muted text-sm">Carregando…</div>;

  return (
    <div className="px-6 pt-8 pb-28 max-w-md mx-auto">
      <h2 className="font-display text-3xl font-semibold mb-6">Próximos</h2>
      {futuros.length === 0 && (
        <p className="text-muted text-sm mb-8">Nada marcado ainda. Toque em + para começar.</p>
      )}
      <div className="space-y-4">
        {futuros.map((ev, i) => (
          <Card key={ev.id} ev={ev} fotoUrl={fotos[ev.foto_path]} meuId={user.id}
            onExcluir={excluir} onEditar={onEditar} onToggle={toggleConfirmacao} delay={i * 60} />
        ))}
      </div>
      {passados.length > 0 && (
        <div className="mt-10">
          <button onClick={() => setMostrarPassados((v) => !v)} className="text-muted text-sm underline underline-offset-4">
            {mostrarPassados ? "Ocultar anteriores" : `Ver anteriores (${passados.length})`}
          </button>
          {mostrarPassados && (
            <div className="space-y-4 mt-5 opacity-70">
              {passados.map((ev) => (
                <Card key={ev.id} ev={ev} fotoUrl={fotos[ev.foto_path]} meuId={user.id}
                  onExcluir={excluir} onEditar={onEditar} onToggle={toggleConfirmacao} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Card({ ev, fotoUrl, meuId, onExcluir, onEditar, onToggle, delay = 0 }) {
  const souEu = ev.created_by === meuId;
  const cor = souEu ? "text-terracotta" : "text-teal";
  const nome = ev.autor?.nome || "?";

  const confirmacoes = ev.confirmacoes || [];
  const jaConfirmei = confirmacoes.some((c) => c.user_id === meuId);
  const nomesConfirmados = confirmacoes.map((c) => c.profiles?.nome).filter(Boolean);

  return (
    <article className="bg-white border border-line rounded-3xl overflow-hidden animate-rise" style={{ animationDelay: `${delay}ms` }}>
      {fotoUrl && <img src={fotoUrl} alt={ev.titulo} className="w-full h-44 object-cover" />}
      <div className="p-4">
        <p className="text-muted text-xs uppercase tracking-wide">{formatarData(ev.data)}</p>
        <h3 className="font-display text-xl font-semibold mt-1 leading-tight">{ev.titulo}</h3>
        {ev.descricao && <p className="text-sm text-muted mt-1">{ev.descricao}</p>}

        <button
          onClick={() => onToggle(ev, jaConfirmei)}
          className={`mt-3 flex items-center gap-2 text-sm font-medium transition-colors ${
            jaConfirmei ? "text-teal" : "text-muted"
          }`}
        >
          <span
            className={`w-5 h-5 rounded-md border flex items-center justify-center ${
              jaConfirmei ? "bg-teal border-teal text-white" : "border-line bg-white"
            }`}
          >
            {jaConfirmei ? "✓" : ""}
          </span>
          {jaConfirmei ? "Você vai" : "Eu vou"}
        </button>

        {nomesConfirmados.length > 0 && (
          <p className="text-xs text-muted mt-2">
            Confirmado por {nomesConfirmados.join(" e ")}
          </p>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className={`text-xs font-medium ${cor}`}>{souEu ? "Você" : nome} registrou</span>
          {souEu && (
            <div className="flex gap-4">
              <button onClick={() => onEditar(ev)} className="text-muted text-xs">Editar</button>
              <button onClick={() => onExcluir(ev)} className="text-muted text-xs">Excluir</button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}