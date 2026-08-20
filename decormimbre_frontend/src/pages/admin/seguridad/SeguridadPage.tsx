import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, ShieldAlert, Smartphone } from 'lucide-react'
import { twoFaApi, type TwoFASetup } from '@/api/twofa'
import PageHeader from '@/components/ui/PageHeader'
import Spinner from '@/components/ui/Spinner'
import Btn from '@/components/ui/Btn'

export default function SeguridadPage() {
  const qc = useQueryClient()
  const [setup, setSetup] = useState<TwoFASetup | null>(null)
  const [code, setCode] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [error, setError] = useState('')

  const { data: statusData, isLoading } = useQuery({
    queryKey: ['2fa-status'],
    queryFn: () => twoFaApi.status(),
  })
  const enabled: boolean = statusData?.data?.enabled ?? false

  const iniciar = useMutation({
    mutationFn: () => twoFaApi.setup(),
    onSuccess: (r) => { setSetup(r.data); setError('') },
    onError: () => setError('No se pudo iniciar la configuración.'),
  })

  const activar = useMutation({
    mutationFn: () => twoFaApi.enable(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['2fa-status'] })
      setSetup(null); setCode(''); setError('')
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { error?: { message?: string } } } }
      setError(err.response?.data?.error?.message ?? 'Código incorrecto.')
    },
  })

  const desactivar = useMutation({
    mutationFn: () => twoFaApi.disable(disableCode),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['2fa-status'] }); setDisableCode(''); setError('') },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { error?: { message?: string } } } }
      setError(err.response?.data?.error?.message ?? 'Código incorrecto.')
    },
  })

  const codeInput = (value: string, onChange: (v: string) => void) => (
    <input
      type="text" inputMode="numeric" maxLength={6} value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
      placeholder="123456"
      className="w-40 rounded-xl border border-[rgba(92,64,51,0.15)] bg-white px-4 py-2.5 text-center text-lg tracking-[0.35em] text-[rgba(92,64,51,0.9)] outline-none focus:border-[rgba(92,64,51,0.4)]"
    />
  )

  return (
    <div className="p-6 md:p-8">
      <PageHeader eyebrow="Cuenta" title="Seguridad" subtitle="Verificación en dos pasos (2FA)" />

      {isLoading ? <Spinner /> : (
        <div className="max-w-xl bg-white rounded-[1.5rem] border border-[rgba(92,64,51,0.09)] shadow-[0_1px_3px_rgba(92,64,51,0.05)] p-6">
          {/* Estado */}
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center ${enabled ? 'bg-green-50' : 'bg-amber-50'}`}>
              {enabled ? <ShieldCheck className="w-5 h-5 text-green-600" /> : <ShieldAlert className="w-5 h-5 text-amber-500" />}
            </div>
            <div>
              <p className="text-sm font-medium text-[rgba(92,64,51,0.9)]">
                {enabled ? 'Verificación en dos pasos ACTIVA' : 'Verificación en dos pasos inactiva'}
              </p>
              <p className="text-xs text-[rgba(92,64,51,0.55)]">
                {enabled ? 'Tu cuenta pide un código de tu app al iniciar sesión.' : 'Añade una capa extra de seguridad con una app autenticadora.'}
              </p>
            </div>
          </div>

          {/* Activar */}
          {!enabled && !setup && (
            <Btn onClick={() => iniciar.mutate()} disabled={iniciar.isPending}>
              <Smartphone className="w-4 h-4" /> {iniciar.isPending ? 'Preparando…' : 'Activar 2FA'}
            </Btn>
          )}

          {!enabled && setup && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-[rgba(92,64,51,0.75)]">
                1) Escanea este código QR con <strong>Google Authenticator</strong> o <strong>Authy</strong>:
              </p>
              <img src={setup.qr} alt="QR 2FA" className="w-44 h-44 self-center border border-[rgba(92,64,51,0.1)] rounded-xl" />
              <p className="text-xs text-[rgba(92,64,51,0.5)] break-all">
                ¿No puedes escanear? Ingresa esta clave manualmente: <code className="text-[rgba(92,64,51,0.8)]">{setup.secret}</code>
              </p>
              <p className="text-sm text-[rgba(92,64,51,0.75)]">2) Ingresa el código de 6 dígitos que muestra la app:</p>
              <div className="flex items-center gap-3">
                {codeInput(code, setCode)}
                <Btn onClick={() => activar.mutate()} disabled={activar.isPending || code.length < 6}>
                  {activar.isPending ? 'Verificando…' : 'Confirmar y activar'}
                </Btn>
              </div>
            </div>
          )}

          {/* Desactivar */}
          {enabled && (
            <div className="flex flex-col gap-3 pt-2 border-t border-[rgba(92,64,51,0.08)] mt-2">
              <p className="text-sm text-[rgba(92,64,51,0.75)]">Para desactivarla, confirma con un código actual de tu app:</p>
              <div className="flex items-center gap-3">
                {codeInput(disableCode, setDisableCode)}
                <Btn variant="secondary" onClick={() => desactivar.mutate()} disabled={desactivar.isPending || disableCode.length < 6}>
                  {desactivar.isPending ? 'Desactivando…' : 'Desactivar 2FA'}
                </Btn>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500 mt-4">{error}</p>}
        </div>
      )}
    </div>
  )
}
