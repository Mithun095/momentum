'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/trpc/client'
import { useToast } from '@/hooks/use-toast'
import {
    Send, Plus, Trash2, MessageSquare, Bot, User,
    Sparkles, ArrowLeft, Loader2, AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'

// Message component
function ChatMessage({ message }: { message: { role: string; content: string; createdAt: Date } }) {
    const isUser = message.role === 'user'

    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser
                ? 'bg-gray-800 dark:bg-gray-200'
                : 'bg-gradient-to-br from-violet-500 to-purple-600'
                }`}>
                {isUser ? (
                    <User className="h-4 w-4 text-white dark:text-gray-800" />
                ) : (
                    <Bot className="h-4 w-4 text-white" />
                )}
            </div>
            <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
                <div className={`inline-block rounded-2xl px-4 py-2 ${isUser
                    ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 rounded-tr-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm'
                    }`}>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(message.createdAt), 'h:mm a')}
                </p>
            </div>
        </div>
    )
}

// Conversation list sidebar
function ConversationList({
    conversations,
    activeId,
    onSelect,
    onNew,
    onDelete
}: {
    conversations: { id: string; title: string; updatedAt: Date }[];
    activeId?: string;
    onSelect: (id: string) => void;
    onNew: () => void;
    onDelete: (id: string) => void;
}) {
    return (
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <Button
                    onClick={onNew}
                    className="w-full bg-gray-800 hover:bg-gray-700 dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-900"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Chat
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                        No conversations yet
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        {conversations.map((conv) => (
                            <div
                                key={conv.id}
                                className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${activeId === conv.id
                                    ? 'bg-gray-100 dark:bg-gray-800'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                    }`}
                                onClick={() => onSelect(conv.id)}
                            >
                                <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                                        {conv.title}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {format(new Date(conv.updatedAt), 'MMM d')}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-opacity"
                                >
                                    <Trash2 className="h-3 w-3 text-gray-400" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default function AiAssistantPage() {
    const router = useRouter()
    const { toast } = useToast()
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
    const [inputMessage, setInputMessage] = useState('')
    const [isCreatingConversation, setIsCreatingConversation] = useState(false)

    // Check if AI is available
    const { data: aiStatus } = api.ai.isAvailable.useQuery()

    // Get conversations
    const { data: conversations, refetch: refetchConversations } = api.ai.getConversations.useQuery()

    // Get active conversation
    const { data: activeConversation, refetch: refetchActiveConversation } = api.ai.getConversation.useQuery(
        { id: activeConversationId! },
        { enabled: !!activeConversationId }
    )

    // Create conversation mutation
    const createConversationMutation = api.ai.createConversation.useMutation({
        onSuccess: (conversation) => {
            setActiveConversationId(conversation.id)
            refetchConversations()
            setIsCreatingConversation(false)
        },
        onError: (error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
            setIsCreatingConversation(false)
        }
    })

    // Send message mutation
    const sendMessageMutation = api.ai.sendMessage.useMutation({
        onSuccess: () => {
            setInputMessage('')
            refetchActiveConversation()
            refetchConversations()
        },
        onError: (error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
        }
    })

    // Delete conversation mutation
    const deleteConversationMutation = api.ai.deleteConversation.useMutation({
        onSuccess: () => {
            if (activeConversationId === deleteConversationMutation.variables?.id) {
                setActiveConversationId(null)
            }
            refetchConversations()
        }
    })

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [activeConversation?.messages])

    // Auto-select first conversation
    useEffect(() => {
        if (conversations && conversations.length > 0 && !activeConversationId) {
            setActiveConversationId(conversations[0].id)
        }
    }, [conversations, activeConversationId])

    const handleNewConversation = async () => {
        setIsCreatingConversation(true)
        createConversationMutation.mutate({})
    }

    const handleSendMessage = () => {
        if (!inputMessage.trim() || !activeConversationId) return
        sendMessageMutation.mutate({
            conversationId: activeConversationId,
            content: inputMessage.trim()
        })
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    if (!aiStatus?.available) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <Card className="max-w-md mx-4">
                    <CardContent className="p-8 text-center">
                        <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            AI Assistant Not Available
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            The AI service is not configured. Please set GEMINI_API_KEY in your environment.
                        </p>
                        <DebugInfo />
                        <Button onClick={() => router.push('/dashboard')}>
                            Back to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    function DebugInfo() {
        const { data: debug } = api.ai.debugEnv.useQuery()
        if (!debug) return null
        return (
            <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs text-left font-mono">
                <p>Key Present: {debug.hasKey ? 'Yes' : 'No'}</p>
                <p>Key Length: {debug.keyLength}</p>
                <p>Start: {debug.keyStart}...</p>
                <p>Placeholder: {debug.isPlaceholder ? 'Yes' : 'No'}</p>
                <p>Env: {debug.nodeEnv}</p>
            </div>
        )
    }

    return (
        <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            {/* Top Navigation */}
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <a href="/dashboard" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                ← Dashboard
                            </a>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                    <Sparkles className="h-4 w-4 text-white" />
                                </div>
                                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                    Momentum AI
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="hidden md:block">
                    <ConversationList
                        conversations={conversations || []}
                        activeId={activeConversationId || undefined}
                        onSelect={setActiveConversationId}
                        onNew={handleNewConversation}
                        onDelete={(id) => deleteConversationMutation.mutate({ id })}
                    />
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
                    {!activeConversationId ? (
                        // No conversation selected
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center max-w-md px-4">
                                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                    <Sparkles className="h-8 w-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                    Welcome to Momentum AI
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    Your personal assistant for habits, tasks, and productivity. Start a conversation to get personalized insights and recommendations.
                                </p>
                                <Button
                                    onClick={handleNewConversation}
                                    disabled={isCreatingConversation}
                                    className="bg-gray-800 hover:bg-gray-700 dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-900"
                                >
                                    {isCreatingConversation ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                    )}
                                    Start Conversation
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {activeConversation?.messages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-gray-500 dark:text-gray-400">
                                            Send a message to start the conversation
                                        </p>
                                    </div>
                                ) : (
                                    activeConversation?.messages.map((message) => (
                                        <ChatMessage key={message.id} message={message} />
                                    ))
                                )}
                                {sendMessageMutation.isPending && (
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                            <Bot className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-2">
                                            <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                                <div className="flex gap-3">
                                    <textarea
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask me anything about your habits, tasks, or goals..."
                                        rows={1}
                                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                                        disabled={sendMessageMutation.isPending}
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                                        className="px-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-400 mt-2 text-center">
                                    Press Enter to send, Shift+Enter for new line
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
