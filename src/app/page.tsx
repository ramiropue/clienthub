"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ButtonCustom } from "@/components/ui/button-custom";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (eEmail: string, ePass: string) => {
    if (!eEmail || !ePass) {
      setErrorMsg("Por favor, introduce tu email y contraseña.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: eEmail,
        password: ePass,
      });

      if (error) {
        if (error.message === "Invalid login credentials") {
          setErrorMsg("El correo electrónico o la contraseña no son válidos.");
        } else {
          setErrorMsg(error.message);
        }
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Fetch user profile to redirect
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("role, client_id")
          .eq("id", data.user.id)
          .single();

        if (profileErr || !profile) {
          setErrorMsg("No se pudo obtener el perfil de usuario.");
          setLoading(false);
          return;
        }

        // Redirect based on role
        if (profile.role === "admin") {
          router.push("/admin");
        } else if (profile.role === "client" && profile.client_id) {
          router.push(`/client/${profile.client_id}`);
        } else {
          setErrorMsg("Rol de usuario desconocido o no asignado.");
          setLoading(false);
        }
      }
    } catch (err: any) {
      setErrorMsg("Ocurrió un error inesperado al iniciar sesión.");
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(email, password);
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
          <h2 className="display" style={{ fontSize: 44, margin: '4px 0 28px', letterSpacing: 0 }}>
            Inicia <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>sesión</em>
          </h2>

          {errorMsg && (
            <div 
              style={{ 
                background: "rgba(232, 66, 26, 0.08)", 
                borderLeft: "3px solid var(--accent)", 
                padding: "12px 16px", 
                borderRadius: 6,
                fontSize: 13,
                color: "var(--accent)",
                marginBottom: 20,
                lineHeight: "1.4"
              }}
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="col gap-4">
            <div className="field">
              <label>Email</label>
              <input 
                className="input" 
                type="email" 
                placeholder="tu@email.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                disabled={loading}
                required
              />
            </div>
            <div className="field">
              <label>Contraseña</label>
              <input 
                className="input" 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                disabled={loading}
                required
              />
            </div>
            <div className="row between" style={{ fontSize: 12 }}>
              <label className="row gap-2" style={{ color: 'var(--ink-2)' }}>
                <input type="checkbox" defaultChecked /> Recuérdame
              </label>
              <a style={{ color: 'var(--ink-2)', cursor: 'pointer' }}>¿Olvidaste tu contraseña?</a>
            </div>
            
            <ButtonCustom 
              variant="primary" 
              size="lg" 
              type="submit" 
              style={{ width: '100%', marginTop: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{
                    width: 14,
                    height: 14,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  Entrando...
                </>
              ) : "Entrar"}
            </ButtonCustom>
          </form>
        </div>
      </div>
      
      {/* Dynamic spinner animation */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
