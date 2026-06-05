import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import api, { unwrap } from '../lib/api'
import type { ApiResponse, ApiError } from '../types/api'
import type { AiProvider, AiKey } from '../types/ai'
import { fetchAiKeys, upsertAiKey, deleteAiKey } from '../api/aiKeys'
import { useToast } from '../context/ToastContext'
import Button from '../components/ui/Button'
import { Section, FieldRow, EyeIcon } from '../components/ui/settingsUi'

const keyInputClass =
  'w-full px-3 py-2 pr-10 text-base bg-white dark:bg-zinc-800 rounded-lg text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all border border-slate-300 dark:border-zinc-700'

export default function AiKeysPage() {
  const qc = useQueryClient()
  const { push: toast } = useToast()

  const { data: providers } = useQuery<AiProvider[]>({
    queryKey: ['ai-providers'],
    queryFn: () => api.get<ApiResponse<AiProvider[]>>('/ai/providers').then(unwrap),
  })
  const { data: keys } = useQuery<AiKey[]>({
    queryKey: ['ai-keys'],
    queryFn: fetchAiKeys,
  })

  const keyByProvider = useMemo(
    () => Object.fromEntries((keys ?? []).map(k => [k.providerId, k])),
    [keys],
  )

  // 各 provider 的輸入值與顯示/隱藏狀態（受控，輸入時即時濾掉空白）
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [shown, setShown] = useState<Record<string, boolean>>({})
  const [activeId, setActiveId] = useState<string | null>(null)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['ai-keys'] })
    qc.invalidateQueries({ queryKey: ['ai-providers'] })
  }

  const upsertM = useMutation({
    mutationFn: (v: { providerId: string; apiKey: string }) => upsertAiKey(v.providerId, v.apiKey),
    onSuccess: (_d, v) => {
      invalidate()
      setInputs(s => ({ ...s, [v.providerId]: '' }))
      toast('success', 'AI 金鑰已儲存')
    },
    onError: (e: AxiosError<ApiError>) => toast('error', e.response?.data?.detail ?? '儲存失敗，請確認金鑰是否正確'),
  })

  const deleteM = useMutation({
    mutationFn: (providerId: string) => deleteAiKey(providerId),
    onSuccess: () => { invalidate(); toast('success', 'AI 金鑰已刪除') },
    onError: (e: AxiosError<ApiError>) => toast('error', e.response?.data?.detail ?? '刪除失敗'),
  })

  return (
    <div className="h-full overflow-y-auto"><div className="p-4 sm:p-6 lg:p-8 max-w-2xl flex flex-col gap-6">
      {keys && keys.length === 0 && (
        <div className="px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-sm text-amber-700 dark:text-amber-300">
          請先設定至少一組 AI 金鑰，才能使用後台其他功能。
        </div>
      )}

      <Section title="AI 金鑰" description="請先填入供應商金鑰以開啟後台其他功能；金鑰加密儲存，僅顯示後 4 碼">
        {!providers && <p className="text-sm text-slate-400 dark:text-zinc-400">載入中…</p>}

        {(providers ?? []).map(p => {
          const existing = keyByProvider[p.id]
          const value = inputs[p.id] ?? ''
          const hint = existing
            ? `已設定金鑰 ••••${existing.keyLastFour}`
            : '尚未設定，請填入金鑰以使用此供應商'

          return (
            <FieldRow key={p.id} label={p.displayName} hint={hint}>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={shown[p.id] ? 'text' : 'password'}
                    value={value}
                    // 金鑰不應含空白：輸入時即時濾掉（按空白鍵不產生字元、貼上也清乾淨）
                    onChange={e => setInputs(s => ({ ...s, [p.id]: e.target.value.replace(/\s/g, '') }))}
                    placeholder={existing ? '輸入新金鑰以更換' : `貼上 ${p.displayName} API Key`}
                    className={keyInputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShown(s => ({ ...s, [p.id]: !s[p.id] }))}
                    className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                    tabIndex={-1}
                  >
                    <EyeIcon open={!!shown[p.id]} />
                  </button>
                </div>
                <Button
                  size="sm"
                  loading={upsertM.isPending && activeId === p.id}
                  disabled={!value.trim() || deleteM.isPending}
                  onClick={() => { setActiveId(p.id); upsertM.mutate({ providerId: p.id, apiKey: value }) }}
                >
                  {existing ? '更換' : '儲存'}
                </Button>
                {existing && (
                  <Button
                    variant="danger"
                    size="sm"
                    loading={deleteM.isPending && activeId === p.id}
                    disabled={upsertM.isPending}
                    onClick={() => { setActiveId(p.id); deleteM.mutate(p.id) }}
                  >
                    刪除
                  </Button>
                )}
              </div>
            </FieldRow>
          )
        })}

        {providers && providers.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-zinc-400">尚無可用的 AI 供應商</p>
        )}
      </Section>
    </div></div>
  )
}
