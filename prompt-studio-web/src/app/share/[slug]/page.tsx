import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { fetchSharedConversation } from '@/lib/api'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Markdown from '@/components/ui/Markdown'
import Link from 'next/link'

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  try {
    const conv = await fetchSharedConversation(slug)
    if (!conv) return { title: '找不到此分享' }
    return {
      title: `${conv.title} | Prompt Studio`,
      description: `由 ${conv.personaName ?? 'AI'} 生成的對話紀錄`,
      openGraph: {
        title: conv.title,
        description: `由 ${conv.personaName ?? 'AI'} 生成的對話紀錄`,
        type: 'article',
      },
    }
  } catch {
    return { title: '找不到此分享' }
  }
}

export default async function SharePage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  let conv
  try {
    conv = await fetchSharedConversation(slug)
  } catch {
    notFound()
  }
  if (!conv) notFound()

  const displayMessages = conv.messages.filter(m => m.role === 'user' || m.role === 'assistant')

  return (
    <>
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* 已刪除封存提示 */}
        {conv.isDeleted && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <span>⚠️</span>
            <span>此對話已被刪除，目前僅供查看存檔內容</span>
          </div>
        )}

        {/* 對話標頭 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400 mb-2">
            <span>{conv.personaEmoji ?? '🤖'} {conv.personaName ?? 'AI'}</span>
            <span>·</span>
            <span>分享於 {new Date(conv.createdAt).toLocaleDateString('zh-TW')}</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-zinc-100">{conv.title}</h1>
        </div>

        {/* 訊息列表：user 右對齊 violet，assistant 左對齊 slate */}
        <div className="flex flex-col gap-4">
          {displayMessages.map(msg => {
            const isUser = msg.role === 'user'
            return (
              <div key={msg.id} className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold mt-0.5 ${
                  isUser
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-200 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400'
                }`}>
                  {isUser ? 'U' : (conv.personaEmoji ?? '🤖')}
                </div>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed break-words ${
                  isUser
                    ? 'bg-violet-500 text-white rounded-tr-sm whitespace-pre-wrap'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 rounded-tl-sm'
                }`}>
                  {isUser ? msg.content : <Markdown>{msg.content}</Markdown>}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-10 border-t border-slate-100 dark:border-zinc-800 pt-6 flex flex-col items-center gap-3">
          {conv.isDeleted ? (
            <p className="text-sm text-slate-400 dark:text-zinc-500">此對話已刪除，不提供繼續對話功能</p>
          ) : (
            <Link
              href={conv.personaId ? `/chat?personaId=${conv.personaId}` : '/chat'}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors"
            >
              繼續對話 →
            </Link>
          )}
          <p className="text-xs text-slate-400 dark:text-zinc-500">此對話由 Prompt Studio 生成</p>
          <Link
            href="/"
            className="text-xs text-violet-500 hover:text-violet-700 dark:hover:text-violet-300 hover:underline transition-colors"
          >
            前往 Prompt Studio →
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
