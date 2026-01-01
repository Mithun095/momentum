import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'

export const workspaceRouter = createTRPCRouter({
    // Get all workspaces for the current user
    getAll: protectedProcedure.query(async ({ ctx }) => {
        const memberships = await ctx.db.workspaceMember.findMany({
            where: { userId: ctx.session.user.id },
            include: {
                workspace: {
                    include: {
                        members: {
                            include: { user: { select: { id: true, name: true, email: true, image: true } } }
                        },
                        _count: { select: { sharedHabits: true } }
                    }
                }
            },
            orderBy: { joinedAt: 'desc' }
        })

        return memberships.map(m => ({
            ...m.workspace,
            role: m.role,
            memberCount: m.workspace.members.length,
            habitCount: m.workspace._count.sharedHabits
        }))
    }),

    // Get single workspace by ID
    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            // Check membership
            const membership = await ctx.db.workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId: input.id,
                        userId: ctx.session.user.id
                    }
                }
            })

            if (!membership) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a member of this workspace' })
            }

            const workspace = await ctx.db.workspace.findUnique({
                where: { id: input.id },
                include: {
                    members: {
                        include: { user: { select: { id: true, name: true, email: true, image: true } } },
                        orderBy: { joinedAt: 'asc' }
                    },
                    sharedHabits: {
                        where: { isActive: true },
                        orderBy: { createdAt: 'desc' }
                    }
                }
            })

            return { ...workspace, currentUserRole: membership.role }
        }),

    // Create a new workspace
    create: protectedProcedure
        .input(z.object({
            name: z.string().min(1).max(100),
            description: z.string().optional(),
            type: z.enum(['team', 'hr', 'company']).default('team')
        }))
        .mutation(async ({ ctx, input }) => {
            // Create workspace and add creator as owner
            const workspace = await ctx.db.workspace.create({
                data: {
                    name: input.name,
                    description: input.description,
                    type: input.type,
                    members: {
                        create: {
                            userId: ctx.session.user.id,
                            role: 'owner'
                        }
                    }
                },
                include: {
                    members: {
                        include: { user: { select: { id: true, name: true, email: true, image: true } } }
                    }
                }
            })

            return workspace
        }),

    // Update workspace
    update: protectedProcedure
        .input(z.object({
            id: z.string(),
            name: z.string().min(1).max(100).optional(),
            description: z.string().optional()
        }))
        .mutation(async ({ ctx, input }) => {
            // Check if user is owner or admin
            const membership = await ctx.db.workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId: input.id,
                        userId: ctx.session.user.id
                    }
                }
            })

            if (!membership || !['owner', 'admin'].includes(membership.role)) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to update this workspace' })
            }

            const workspace = await ctx.db.workspace.update({
                where: { id: input.id },
                data: {
                    name: input.name,
                    description: input.description
                }
            })

            return workspace
        }),

    // Delete workspace
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // Check if user is owner
            const membership = await ctx.db.workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId: input.id,
                        userId: ctx.session.user.id
                    }
                }
            })

            if (!membership || membership.role !== 'owner') {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the owner can delete a workspace' })
            }

            await ctx.db.workspace.delete({ where: { id: input.id } })
            return { success: true }
        }),

    // Invite member by email
    inviteMember: protectedProcedure
        .input(z.object({
            workspaceId: z.string(),
            email: z.string().email(),
            role: z.enum(['admin', 'member', 'viewer']).default('member')
        }))
        .mutation(async ({ ctx, input }) => {
            // Check if current user is owner or admin
            const membership = await ctx.db.workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId: input.workspaceId,
                        userId: ctx.session.user.id
                    }
                }
            })

            if (!membership || !['owner', 'admin'].includes(membership.role)) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to invite members' })
            }

            // Find user by email
            const user = await ctx.db.user.findUnique({ where: { email: input.email } })

            if (!user) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'User with this email not found' })
            }

            // Check if already a member
            const existingMember = await ctx.db.workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId: input.workspaceId,
                        userId: user.id
                    }
                }
            })

            if (existingMember) {
                throw new TRPCError({ code: 'CONFLICT', message: 'User is already a member' })
            }

            // Add member
            const member = await ctx.db.workspaceMember.create({
                data: {
                    workspaceId: input.workspaceId,
                    userId: user.id,
                    role: input.role
                },
                include: {
                    user: { select: { id: true, name: true, email: true, image: true } }
                }
            })

            return member
        }),

    // Remove member
    removeMember: protectedProcedure
        .input(z.object({
            workspaceId: z.string(),
            userId: z.string()
        }))
        .mutation(async ({ ctx, input }) => {
            // Check if current user is owner or admin
            const membership = await ctx.db.workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId: input.workspaceId,
                        userId: ctx.session.user.id
                    }
                }
            })

            if (!membership || !['owner', 'admin'].includes(membership.role)) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to remove members' })
            }

            // Cannot remove the owner
            const targetMembership = await ctx.db.workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId: input.workspaceId,
                        userId: input.userId
                    }
                }
            })

            if (targetMembership?.role === 'owner') {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot remove the workspace owner' })
            }

            await ctx.db.workspaceMember.delete({
                where: {
                    workspaceId_userId: {
                        workspaceId: input.workspaceId,
                        userId: input.userId
                    }
                }
            })

            return { success: true }
        }),

    // Update member role
    updateMemberRole: protectedProcedure
        .input(z.object({
            workspaceId: z.string(),
            userId: z.string(),
            role: z.enum(['admin', 'member', 'viewer'])
        }))
        .mutation(async ({ ctx, input }) => {
            // Check if current user is owner
            const membership = await ctx.db.workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId: input.workspaceId,
                        userId: ctx.session.user.id
                    }
                }
            })

            if (!membership || membership.role !== 'owner') {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the owner can change roles' })
            }

            // Cannot change owner's role
            if (input.userId === ctx.session.user.id) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot change your own role' })
            }

            const updatedMember = await ctx.db.workspaceMember.update({
                where: {
                    workspaceId_userId: {
                        workspaceId: input.workspaceId,
                        userId: input.userId
                    }
                },
                data: { role: input.role },
                include: {
                    user: { select: { id: true, name: true, email: true, image: true } }
                }
            })

            return updatedMember
        }),

    // Leave workspace
    leave: protectedProcedure
        .input(z.object({ workspaceId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const membership = await ctx.db.workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId: input.workspaceId,
                        userId: ctx.session.user.id
                    }
                }
            })

            if (!membership) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Not a member of this workspace' })
            }

            if (membership.role === 'owner') {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Owner cannot leave. Transfer ownership or delete the workspace.' })
            }

            await ctx.db.workspaceMember.delete({
                where: {
                    workspaceId_userId: {
                        workspaceId: input.workspaceId,
                        userId: ctx.session.user.id
                    }
                }
            })

            return { success: true }
        })
})
