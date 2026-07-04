import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./components/Auth";
import EventList from "./components/EventList";
import EventForm from "./components/EventForm";
import Profile from "./components/Profile";

export default function App() {
  const [session, setSession] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [view, setView] = useState("lista"); // lista | form | perfil
  const [eventoEditando, setEventoEditando] = useState(null); // null = criar
  const [chaveLista, setChaveLista] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session); setCarregando(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (carregando) return null;
  if (!session) return <Auth />;
  const user = session.user;

  function abrirNovo() {
    setEventoEditando(null);
    setView("form");
  }
  function abrirEdicao(ev) {
    setEventoEditando(ev);
    setView("form");
  }
  function aoSalvar() {
    setChaveLista((k) => k + 1);
    setEventoEditando(null);
    setView("lista");
  }

  return (
    <div className="min-h-screen">
      {view === "lista" && (
        <EventList key={chaveLista} user={user} onEditar={abrirEdicao} />
      )}
      {view === "form" && (
        <EventForm
          user={user}
          evento={eventoEditando}
          onCancelar={() => { setEventoEditando(null); setView("lista"); }}
          onSalvo={aoSalvar}
        />
      )}
      {view === "perfil" && <Profile user={user} onFechar={() => setView("lista")} />}

      {view === "lista" && (
        <nav className="fixed bottom-0 inset-x-0 border-t border-line bg-paper/90 backdrop-blur">
          <div className="max-w-md mx-auto flex items-center justify-between px-8 py-3">
            <button onClick={() => setView("perfil")} className="text-muted text-sm">Perfil</button>
            <button onClick={abrirNovo}
              className="bg-terracotta text-white w-12 h-12 rounded-full text-2xl leading-none -mt-6 shadow-lg active:scale-95 transition-transform"
              aria-label="Novo evento">+</button>
            <button onClick={() => setChaveLista((k) => k + 1)} className="text-muted text-sm">Atualizar</button>
          </div>
        </nav>
      )}
    </div>
  );
}