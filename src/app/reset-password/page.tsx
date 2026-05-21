"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ButtonCustom } from "@/components/ui/button-custom";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setErrorMsg("Por favor, rellena todos los campos.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      setSuccessMsg("Contraseña actualizada con éxito. Redirigiendo...");
      setTimeout(() => {
        router.push("/");
      }, 2000);
      
    } catch (err: any) {
      setErrorMsg("Ocurrió un error inesperado al actualizar la contraseña.");
      setLoading(false);
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
        </div>

        <div>
          <div className="login-meta mb-4">Seguridad</div>
          <h1>
            Crea tu nueva<br />
            <em>contraseña</em>
          </h1>
          <p style={{ color: 'rgba(255,255,255,.55)', maxWidth: 480, fontSize: 16, lineHeight: 1.55, marginTop: 24 }}>
            Establece una nueva contraseña para acceder a tu área de cliente y ver el estado de tus trabajos.
          </p>
        </div>
      </div>

      <div className="login-form-wrap">
        <div className="login-form">
          <div className="eyebrow mb-2">Restablecer acceso</div>
          <h2 className="display" style={{ fontSize: 44, margin: '4px 0 28px', letterSpacing: 0 }}>
            Nueva <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>contraseña</em>
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

          {successMsg && (
            <div 
              style={{ 
                background: "rgba(46, 204, 113, 0.08)", 
                borderLeft: "3px solid var(--ok)", 
                padding: "12px 16px", 
                borderRadius: 6,
                fontSize: 13,
                color: "var(--ok)",
                marginBottom: 20,
                lineHeight: "1.4"
              }}
            >
              {successMsg}
            </div>
          )}

          {!successMsg && (
            <form onSubmit={handleUpdatePassword} className="col gap-4">
              <div className="field">
                <label>Nueva contraseña</label>
                <input 
                  className="input" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  disabled={loading}
                  required
                  minLength={6}
                />
              </div>
              <div className="field">
                <label>Confirmar nueva contraseña</label>
                <input 
                  className="input" 
                  type="password" 
                  placeholder="••••••••" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  disabled={loading}
                  required
                  minLength={6}
                />
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
                    Guardando...
                  </>
                ) : "Guardar contraseña"}
              </ButtonCustom>
            </form>
          )}
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
