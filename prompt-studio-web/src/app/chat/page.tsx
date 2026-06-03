import { Suspense } from 'react'
import ChatClient from './ChatClient'

// useSearchParams() 需要 Suspense 邊界，由此 server component 提供
export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatClient />
    </Suspense>
  )
}
