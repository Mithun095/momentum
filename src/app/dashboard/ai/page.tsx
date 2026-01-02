'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/lib/trpc/client'
import { useToast } from '@/hooks/use-toast'
import {
    Send, Plus, Trash2, MessageSquare, Bot, User,
    Sparkles, Loader2, AlertCircle, Mic
} from 'lucide-react'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import { ToolActionCard } from '@/components/ai/ToolActionCard'
import { VoiceInput } from '@/components/ai/VoiceInput'
import { ConsentBanner } from '@/components/ai/ConsentBanner'

interface ToolCall {
    name: string
    args: Record<string, unknown>
    result?: unknown
}

interface MessageWithMetadata {
    id: string
    role: string
    content: string
    createdAt: Date
    metadata?: string | null
}

// Message component with tool support
function ChatMessage({ message }: { message: MessageWithMetadata }) {
    const isUser = message.role === 'user'

    // Parse tool calls from metadata
    let toolCalls: ToolCall[] = []
    if (message.metadata) {
        try {
            const parsed = JSON.parse(message.metadata)
            toolCalls = parsed.toolCalls || []
        } catch (e) {
            // Ignore parse errors
        }
    }

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
                {/* Tool action cards */}
                {!isUser && toolCalls.length > 0 && (
                    <div className="space-y-2 mb-2">
                        {toolCalls.map((tc, i) => (
                            <ToolActionCard key={i} toolCall={tc} />
                        ))}
                    </div>
                )}

                {/* Message content */}
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

// Quick suggestions
function QuickSuggestions({ onSelect }: { onSelect: (text: string) => void }) {
    const suggestions = [
        "Create a task to review my goals tomorrow",
        "What habits should I try?",
        "How's my productivity this week?",
        "Analyze my mood patterns",
    ]

    return (
        <div className="flex flex-wrap gap-2 justify-center mt-4">
            {suggestions.map((s, i) => (
                <button
                    key={i}
                    onClick={() => onSelect(s)}
                    className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    {s}
                </button>
            ))}
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
    const [hasConsent, setHasConsent] = useState<boolean | null>(null)

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

    // Send message with tools mutation
    const sendMessageMutation = api.ai.sendMessageWithTools.useMutation({
        onSuccess: (data) => {
            setInputMessage('')
            refetchActiveConversation()
            refetchConversations()

            // Notify about tool actions
            if (data.toolCalls && data.toolCalls.length > 0) {
                const toolNames = data.toolCalls.map(t => t.name).join(', ')
                toast({
                    title: '✨ AI Action Completed',
                    description: `Actions performed: ${toolNames}`
                })
            }
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

    const handleSendMessage = (message?: string) => {
        const content = message || inputMessage
        if (!content.trim() || !activeConversationId) return
        sendMessageMutation.mutate({
            conversationId: activeConversationId,
            content: content.trim()
        })
        if (!message) setInputMessage('')
    }

    const handleVoiceTranscript = (text: string) => {
        setInputMessage(prev => prev + (prev ? ' ' : '') + text)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    // Show consent banner if not yet decided
    if (hasConsent === null) {
        return <ConsentBanner onConsent={setHasConsent} />
    }

    // If consent denied, show limited UI
    if (hasConsent === false) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <Card className="max-w-md mx-4">
                    <CardContent className="p-8 text-center">
                        <div className="text-4xl mb-4">🔒</div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            AI Assistant Disabled
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Enable AI access to use the personal assistant features.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Button
                                variant="outline"
                                onClick={() => router.push('/dashboard')}
                            >
                                Back to Dashboard
                            </Button>
                            <Button
                                onClick={() => {
                                    localStorage.removeItem('ai-consent')
                                    setHasConsent(null)
                                }}
                            >
                                Enable AI
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
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
            <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs text-left font-mono mb-4">
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
                                <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                                    With Tools
                                </span>
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
                        // No conversation selected - Welcome screen
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center max-w-md px-4">
                                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                    <Sparkles className="h-8 w-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                    Welcome to Momentum AI
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    Your AI assistant can now <strong>take actions</strong> on your behalf:
                                </p>
                                <div className="grid grid-cols-2 gap-3 text-sm text-left mb-6">
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <span className="text-lg">📋</span>
                                        <p className="font-medium">Create Tasks</p>
                                        <p className="text-gray-500 text-xs">"Remind me to call Mom tomorrow"</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <span className="text-lg">✅</span>
                                        <p className="font-medium">Start Habits</p>
                                        <p className="text-gray-500 text-xs">"I want to meditate daily"</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <span className="text-lg">💡</span>
                                        <p className="font-medium">Get Suggestions</p>
                                        <p className="text-gray-500 text-xs">"What habits should I try?"</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <span className="text-lg">📊</span>
                                        <p className="font-medium">View Insights</p>
                                        <p className="text-gray-500 text-xs">"How am I doing this week?"</p>
                                    </div>
                                </div>
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
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                                            Try asking me to do something!
                                        </p>
                                        <QuickSuggestions onSelect={(text) => {
                                            setInputMessage(text)
                                        }} />
                                    </div>
                                ) : (
                                    activeConversation?.messages.map((message) => (
                                        <ChatMessage
                                            key={message.id}
                                            message={{
                                                ...message,
                                                metadata: typeof message.metadata === 'string' ? message.metadata : undefined
                                            }}
                                        />
                                    ))
                                )}
                                {sendMessageMutation.isPending && (
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                            <Bot className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-2">
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                                                <span className="text-sm text-gray-500">Thinking...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                                <div className="flex gap-2">
                                    <VoiceInput
                                        onTranscript={handleVoiceTranscript}
                                        disabled={sendMessageMutation.isPending}
                                    />
                                    <textarea
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask me to create a task, suggest habits, or show your progress..."
                                        rows={1}
                                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                                        disabled={sendMessageMutation.isPending}
                                    />
                                    <Button
                                        onClick={() => handleSendMessage()}
                                        disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                                        className="px-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-400 mt-2 text-center">
                                    🎤 Use voice input or press Enter to send
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
