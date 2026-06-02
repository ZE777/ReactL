import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Conversation = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

type ConversationStore = {
  conversations: Conversation[]
  activeId: string | null
  setConversations: (conversations: Conversation[]) => void
  addConversation: (conversation: Conversation) => void
  removeConversation: (id: string) => void
  renameConversation: (id: string, title: string) => void
  setActiveId: (id: string | null) => void
}

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set) => ({
      conversations: [],
      activeId: null,

      setConversations: (conversations) =>
        set({ conversations }),

      addConversation: (conversation) =>
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeId: conversation.id,
        })),

      removeConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          activeId: state.activeId === id ? null : state.activeId,
        })),

      renameConversation: (id, title) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title, updatedAt: new Date().toISOString() } : c
          ),
        })),

      setActiveId: (id) =>
        set({ activeId: id }),
    }),
    {
      name: 'conversation-store', // localStorage 的 key 名稱
    }
  )
)
