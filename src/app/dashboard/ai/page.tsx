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
                ? 'bg-foreground'
                : 'bg-primary'
                }`}>
                {isUser ? (
                    <User className="h-4 w-4 text-background" />
                ) : (
                    <Bot className="h-4 w-4 text-primary-foreground" />
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
                    ? 'bg-foreground text-background rounded-tr-sm'
                    : 'bg-muted text-foreground rounded-tl-sm'
                    }`}>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
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
        <div className="w-64 border-r border-border flex flex-col h-full">
            <div className="p-4 border-b border-border">
                <Button
                    onClick={onNew}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Chat
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                        No conversations yet
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        {conversations.map((conv) => (
                            <div
                                key={conv.id}
                                className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${activeId === conv.id
                                    ? 'bg-muted'
                                    : 'hover:bg-muted/50'
                                    }`}
                                onClick={() => onSelect(conv.id)}
                            >
                                <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground truncate">
                                        {conv.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {format(new Date(conv.updatedAt), 'MMM d')}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-opacity"
                                >
                                    <Trash2 className="h-3 w-3 text-muted-foreground" />
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
                    className="px-3 py-1.5 text-sm bg-muted text-muted-foreground rounded-full hover:bg-accent transition-colors"
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
    const utils = api.useUtils()

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

            // Invalidate all relevant data to ensure UI is fresh
            void utils.habit.getAll.invalidate()
            void utils.habit.getStats.invalidate()
            void utils.task.getAll.invalidate()
            void utils.streak.getStreak.invalidate()
            void utils.analytics.getOverallStats.invalidate()

            // Notify about tool actions
            if (data.toolCalls && data.toolCalls.length > 0) {
                const toolNames = data.toolCalls.map(t => t.name).join(', ')
                toast({
                    title: 'AI Action Completed',
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

    const handleSendMessage = async (message?: string) => {
        const content = message || inputMessage
        if (!content.trim()) return

        console.log('[AI Chat] handleSendMessage called', { content: content.slice(0, 30), activeConversationId })

        // Auto-create conversation if none exists
        if (!activeConversationId) {
            console.log('[AI Chat] No active conversation, creating new one...')
            setIsCreatingConversation(true)
            try {
                const newConversation = await createConversationMutation.mutateAsync({})
                console.log('[AI Chat] Created conversation:', newConversation.id)

                // Now send message with the new conversation ID
                console.log('[AI Chat] Sending message to new conversation...')
                await sendMessageMutation.mutateAsync({
                    conversationId: newConversation.id,
                    content: content.trim()
                })
                setInputMessage('')
                console.log('[AI Chat] Message sent successfully')
            } catch (error) {
                console.error('[AI Chat] Error in auto-create flow:', error)
                // Error handled by mutation's onError
            } finally {
                setIsCreatingConversation(false)
            }
            return
        }

        // Send to existing conversation
        console.log('[AI Chat] Sending to existing conversation:', activeConversationId)
        sendMessageMutation.mutate({
            conversationId: activeConversationId,
            content: content.trim()
        })
        if (!message) setInputMessage('')
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
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Card className="max-w-md mx-4">
                    <CardContent className="p-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                            AI Assistant Disabled
                        </h2>
                        <p className="text-muted-foreground mb-4">
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
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Card className="max-w-md mx-4">
                    <CardContent className="p-8 text-center">
                        <AlertCircle className="h-12 w-12 mx-auto text-primary mb-4" />
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                            AI Assistant Not Available
                        </h2>
                        <p className="text-muted-foreground mb-4">
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
            <div className="mt-4 p-2 bg-muted rounded text-xs text-left font-mono mb-4">
                <p>Key Present: {debug.hasKey ? 'Yes' : 'No'}</p>
                <p>Key Length: {debug.keyLength}</p>
                <p>Start: {debug.keyStart}...</p>
                <p>Placeholder: {debug.isPlaceholder ? 'Yes' : 'No'}</p>
                <p>Env: {debug.nodeEnv}</p>
            </div>
        )
    }

    return (
        <div className="h-screen bg-background flex flex-col">
            {/* Top Navigation */}
            <nav className="bg-card border-b border-border flex-shrink-0">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <a href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                                ← Dashboard
                            </a>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                                </div>
                                <h1 className="text-xl font-semibold text-foreground">
                                    Momentum AI
                                </h1>
                                <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-medium">
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
                <div className="flex-1 flex flex-col bg-background">
                    {!activeConversationId ? (
                        // No conversation selected - Welcome screen
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center max-w-md px-4">
                                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary flex items-center justify-center">
                                    <Sparkles className="h-8 w-8 text-primary-foreground" />
                                </div>
                                <h2 className="text-2xl font-semibold text-foreground mb-2">
                                    Welcome to Momentum AI
                                </h2>
                                <p className="text-muted-foreground mb-4">
                                    Your AI assistant can now <strong>take actions</strong> on your behalf:
                                </p>
                                <div className="grid grid-cols-2 gap-3 text-sm text-left mb-6">
                                    <div className="p-3 bg-muted rounded-lg">
                                        <p className="font-medium text-foreground">Create Tasks</p>
                                        <p className="text-muted-foreground text-xs">"Remind me to call Mom tomorrow"</p>
                                    </div>
                                    <div className="p-3 bg-muted rounded-lg">
                                        <p className="font-medium text-foreground">Start Habits</p>
                                        <p className="text-muted-foreground text-xs">"I want to meditate daily"</p>
                                    </div>
                                    <div className="p-3 bg-muted rounded-lg">
                                        <p className="font-medium text-foreground">Get Suggestions</p>
                                        <p className="text-muted-foreground text-xs">"What habits should I try?"</p>
                                    </div>
                                    <div className="p-3 bg-muted rounded-lg">
                                        <p className="font-medium text-foreground">View Insights</p>
                                        <p className="text-muted-foreground text-xs">"How am I doing this week?"</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleNewConversation}
                                    disabled={isCreatingConversation}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
                                        <p className="text-muted-foreground mb-4">
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
                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                            <Bot className="h-4 w-4 text-primary-foreground" />
                                        </div>
                                        <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2">
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">Thinking...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="border-t border-border p-4">
                                <div className="flex gap-2">
                                    <textarea
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask me to create a task, suggest habits, or show your progress..."
                                        rows={1}
                                        className="flex-1 px-4 py-3 rounded-xl border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                        disabled={sendMessageMutation.isPending}
                                    />
                                    <Button
                                        onClick={() => handleSendMessage()}
                                        disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                                        className="px-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2 text-center">
                                    Press Enter to send
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
