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
    const { data, error } = await supabase
      .from("eventos")
      .select("id, titulo, descricao, data, foto_path, created_by, autor:created_by ( nome, avatar_path )")
      .order("data", { ascending: true });
    if (!error && data) {
      setEventos(data);
      setFotos(await signedUrls(data.map((e) => e.foto_path).filter(Boolean)));
    }
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  async function excluir(ev) {
    if (!confirm("Excluir este evento?")) return;
    if (ev.foto_path) await removePhoto(ev.foto_path); // não deixa arquivo órfão
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
            onExcluir={excluir} onEditar={onEditar} delay={i * 60} />
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
                  onExcluir={excluir} onEditar={onEditar} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Card({ ev, fotoUrl, meuId, onExcluir, onEditar, delay = 0 }) {
  const souEu = ev.created_by === meuId;
  const cor = souEu ? "text-terracotta" : "text-teal";
  const nome = ev.autor?.nome || "?";
  return (
    <article className="bg-white border border-line rounded-3xl overflow-hidden animate-rise" style={{ animationDelay: `${delay}ms` }}>
      {fotoUrl && <img src={fotoUrl} alt={ev.titulo} className="w-full h-44 object-cover" />}
      <div className="p-4">
        <p className="text-muted text-xs uppercase tracking-wide">{formatarData(ev.data)}</p>
        <h3 className="font-display text-xl font-semibold mt-1 leading-tight">{ev.titulo}</h3>
        {ev.descricao && <p className="text-sm text-muted mt-1">{ev.descricao}</p>}
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