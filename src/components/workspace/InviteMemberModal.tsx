'use client'

import { useState } from 'react'
import { api } from '@/lib/trpc/client'

interface InviteMemberModalProps {
    isOpen: boolean
    workspaceId: string
    onClose: () => void
    onSuccess?: () => void
}

export function InviteMemberModal({ isOpen, workspaceId, onClose, onSuccess }: InviteMemberModalProps) {
    const [email, setEmail] = useState('')
    const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member')
    const [error, setError] = useState('')

    const utils = api.useUtils()
    const inviteMutation = api.workspace.inviteMember.useMutation({
        onSuccess: () => {
            utils.workspace.getById.invalidate({ id: workspaceId })
            setEmail('')
            setRole('member')
            setError('')
            onClose()
            onSuccess?.()
        },
        onError: (err) => {
            setError(err.message || 'Failed to invite member')
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim()) {
            setError('Email is required')
            return
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address')
            return
        }
        inviteMutation.mutate({ workspaceId, email: email.trim(), role })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Invite Member
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email Address *
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="colleague@example.com"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            autoFocus
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            User must have an account in Momentum
                        </p>
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Role
                        </label>
                        <div className="space-y-2">
                            {[
                                { value: 'admin', label: 'Admin', desc: 'Can manage habits and invite members' },
                                { value: 'member', label: 'Member', desc: 'Can complete habits and view stats' },
                                { value: 'viewer', label: 'Viewer', desc: 'Can only view team progress' }
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setRole(option.value as 'admin' | 'member' | 'viewer')}
                                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${role === option.value
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <p className={`font-medium ${role === option.value ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-white'}`}>
                                        {option.label}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {option.desc}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={inviteMutation.isPending}
                            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {inviteMutation.isPending ? 'Inviting...' : 'Invite'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
