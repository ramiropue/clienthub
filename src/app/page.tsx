"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getClients, Client } from "@/lib/data";
import { Icon } from "@/components/ui/icon";
import { AvatarCustom } from "@/components/ui/avatar-custom";
import { ButtonCustom } from "@/components/ui/button-custom";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    getClients().then(setClients);
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Check if the email matches one of the clients
    const matchedClient = clients.find(
      c => c.email?.toLowerCase().trim() === email.toLowerCase().trim()
    );

    if (matchedClient) {
      router.push(`/client/${matchedClient.id}`);
    } else {
      router.push("/admin");
    }
  };

  return (
    <div className="login-screen">
      <div className="login-art">
        {/* decorative blobs */}
        <span className="swatch" style={{ width: 260, height: 260, background: 'rgba(232,66,26,.18)', top: -60, right: -80 }} />
        <span className="swatch" style={{ width: 140, height: 140, background: 'rgba(255,255,255,.04)', bottom: 40, right: 200 }} />

        <div className="row between" style={{ alignItems: 'center' }}>
          <div className="login-mark">
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 999, background: 'var(--accent)', marginRight: 10, verticalAlign: 'middle' }} />
            ClientHub
          </div>
          <div className="login-meta">v0.4 · beta</div>
        </div>

        <div>
          <div className="login-meta mb-4">Gestión para social media</div>
          <h1>
            Cada trabajo,<br />
            cada mes, <em>en su sitio.</em>
          </h1>
          <p style={{ color: 'rgba(255,255,255,.55)', maxWidth: 480, fontSize: 16, lineHeight: 1.55, marginTop: 24 }}>
            Tú registras lo que vas haciendo para cada cliente y la factura del mes se monta sola.
            Tu cliente entra cuando quiera y ve exactamente qué se ha hecho, cuándo y cuánto cuesta.
          </p>
        </div>

        <div className="row gap-6" style={{ fontSize: 12, color: 'rgba(255,255,255,.45)' }}>
          <span>Hecho con cariño por VidAje AI Studio</span>
          <span>·</span>
          <span>© 2026</span>
        </div>
      </div>

      <div className="login-form-wrap">
        <div className="login-form">
          <div className="eyebrow mb-2">Bienvenida de vuelta</div>
          <h2 className="display" style={{ fontSize: 44, margin: '4px 0 28px', letterSpacing: '-0.015em' }}>
            Inicia <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>sesión</em>
          </h2>

          <form onSubmit={handleLoginSubmit} className="col gap-4">
            <div className="field">
              <label>Email</label>
              <input className="input" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label>Contraseña</label>
              <input className="input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="row between" style={{ fontSize: 12 }}>
              <label className="row gap-2" style={{ color: 'var(--ink-2)' }}>
                <input type="checkbox" defaultChecked /> Recuérdame
              </label>
              <a style={{ color: 'var(--ink-2)', cursor: 'pointer' }}>¿Olvidaste tu contraseña?</a>
            </div>
            <ButtonCustom variant="primary" size="lg" type="submit" style={{ width: '100%', marginTop: 6 }}>
              Entrar
            </ButtonCustom>
          </form>

          <div className="row gap-3 mt-6" style={{ alignItems: 'center' }}>
            <div className="divider flex-1" />
            <span className="eyebrow" style={{ fontSize: 10 }}>Demo</span>
            <div className="divider flex-1" />
          </div>

          <div className="col gap-2 mt-4">
            <button
              className="btn btn-ghost"
              onClick={() => router.push("/admin")}
              style={{ justifyContent: 'flex-start', padding: '12px 14px', width: '100%' }}>

              <AvatarCustom name="Ramiro" color="#161311" size="sm" />
              <span className="col" style={{ alignItems: 'flex-start', gap: 0, marginLeft: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>Entrar como Ramiro</span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>Admin · vista completa</span>
              </span>
              <Icon name="arrow_right" size={14} style={{ marginLeft: 'auto', color: 'var(--muted)' }} />
            </button>

            {clients.map((c) => (
              <button
                key={c.id}
                className="btn btn-ghost"
                onClick={() => router.push(`/client/${c.id}`)}
                style={{ justifyContent: 'flex-start', padding: '12px 14px', width: '100%' }}>

                <AvatarCustom name={c.name} color={c.color} initials={c.initials} size="sm" />
                <span className="col" style={{ alignItems: 'flex-start', gap: 0, marginLeft: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Entrar como {c.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>Cliente · vista de portal</span>
                </span>
                <Icon name="arrow_right" size={14} style={{ marginLeft: 'auto', color: 'var(--muted)' }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
