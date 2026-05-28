import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileText, KeyRound, Loader2, Lock, ShieldCheck } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.camelio.app";

function getTokenFromPath() {
  const parts = String(window.location.pathname || "").split("/").filter(Boolean);
  return parts[0] === "shared-document" ? parts[1] || "" : "";
}

function formatExpiration(value) {
  if (!value) return "";

  try {
    return new Date(value).toLocaleString("fr-CA", {
      dateStyle: "long",
      timeStyle: "short",
    });
  } catch (error) {
    return value;
  }
}

export default function SharedDocument() {
  const token = useMemo(() => getTokenFromPath(), []);

  const [loading, setLoading] = useState(true);
  const [accessing, setAccessing] = useState(false);
  const [error, setError] = useState("");
  const [documentInfo, setDocumentInfo] = useState(null);
  const [code, setCode] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  useEffect(() => {
    loadSharedDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadSharedDocument() {
    if (!token) {
      setError("Lien de partage invalide.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/shared-documents/${token}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Ce lien est invalide ou expiré.");
      }

      setDocumentInfo(data);
    } catch (err) {
      setError(err.message || "Impossible de charger ce lien sécurisé.");
    } finally {
      setLoading(false);
    }
  }

  async function requestAccess() {
    const cleanCode = String(code || "").trim().toUpperCase();

    if (!/^[A-Z0-9]{4}$/.test(cleanCode)) {
      setError("Entre le code d’accès de 4 caractères.");
      return;
    }

    setAccessing(true);
    setError("");
    setDownloadUrl("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/shared-documents/${token}/access`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: cleanCode }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Code invalide ou lien expiré.");
      }

      const url = data?.downloadUrl || data?.url || "";

      if (!url) {
        throw new Error("Le serveur n’a pas retourné de lien d’accès au document.");
      }

      setDownloadUrl(url);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err.message || "Impossible d’ouvrir ce document.");
    } finally {
      setAccessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF7EF] px-4 py-8 text-[#55534C]">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A8B193] text-white shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8A8175]">
              Camelio
            </p>
            <h1 className="text-2xl font-black text-[#4F4A45]">
              Lien sécurisé
            </h1>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#EFE4D6]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-[#A8B193]" />
              <p className="mt-4 text-sm font-bold text-[#746F64]">
                Vérification du lien...
              </p>
            </div>
          )}

          {!loading && error && !documentInfo && (
            <div className="rounded-2xl bg-[#FBECEF] p-4 text-sm font-bold text-[#B96B77] ring-1 ring-[#F3CDD3]">
              {error}
            </div>
          )}

          {!loading && documentInfo && (
            <div className="space-y-5">
              <div className="rounded-3xl bg-[#F4F8FD] p-4 ring-1 ring-[#D3DFF1]">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#6A85AF] ring-1 ring-[#D3DFF1]">
                    <FileText className="h-6 w-6" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#8A8175]">
                      Document partagé
                    </p>
                    <h2 className="mt-1 break-words text-lg font-black text-[#55534C]">
                      {documentInfo.documentName || documentInfo.fileName || "Document Camelio"}
                    </h2>
                    {documentInfo.expiresAt && (
                      <p className="mt-2 text-sm leading-6 text-[#746F64]">
                        Ce lien expire le {formatExpiration(documentInfo.expiresAt)}.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#A8B193] ring-1 ring-[#EFE4D6]">
                    <Lock className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="font-bold text-[#55534C]">
                      Code d’accès requis
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#746F64]">
                      Entre le code de 4 caractères fourni par la personne qui a partagé le document.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-2xl bg-[#FBECEF] p-4 text-sm font-bold text-[#B96B77] ring-1 ring-[#F3CDD3]">
                  {error}
                </div>
              )}

              <label className="block">
                <span className="mb-2 block text-[0.72rem] font-bold uppercase tracking-[0.06em] text-[#8A8175]">
                  Code d’accès
                </span>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8B193]" />
                    <input
                      value={code}
                      maxLength={4}
                      onChange={(event) =>
                        setCode(
                          event.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, "")
                            .slice(0, 4)
                        )
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          requestAccess();
                        }
                      }}
                      placeholder="A7K2"
                      className="w-full rounded-2xl border border-[#DED6C9] bg-[#F7F3EA] py-3 pl-11 pr-4 text-center text-lg font-black uppercase tracking-[0.35em] text-[#55534C] outline-none transition placeholder:text-[#A9A094] focus:border-[#A8B193] focus:bg-white focus:ring-2 focus:ring-[#A8B193]/25"
                    />
                  </div>
                </div>
              </label>

              <button
                type="button"
                onClick={requestAccess}
                disabled={accessing || code.length !== 4}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#A8B193] px-4 py-4 text-sm font-bold text-white shadow-sm transition hover:brightness-95 disabled:opacity-60"
              >
                {accessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                {accessing ? "Vérification..." : "Ouvrir le document"}
              </button>

              {downloadUrl && (
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl bg-[#F8F3EA] px-4 py-3 text-center text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
                >
                  Réouvrir le document
                </a>
              )}
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-[#8A8175]">
          Le document demeure protégé. L’accès est temporaire et contrôlé par Camelio.
        </p>
      </div>
    </div>
  );
}
