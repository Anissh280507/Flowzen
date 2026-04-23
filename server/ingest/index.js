import { Inngest } from 'inngest'
import { prisma } from '../src/db.js'

export const inngest = new Inngest({ id: 'my-app' })

export const functions = [
    inngest.createFunction(
        { id: 'sync-user-from-clerk', triggers: [{ event: 'clerk/user.created' }] },
        async ({ event }) => {
            const { data } = event

            await prisma.user.create({
                data: {
                    id: data.id,
                    email: data?.email_addresses?.[0]?.email_address || '',
                    name: `${data?.first_name || ''} ${data?.last_name || ''}`.trim(),
                    image: data?.image_url || '',
                },
            })
        }
    ),
    inngest.createFunction(
        { id: 'sync-user-update-from-clerk', triggers: [{ event: 'clerk/user.updated' }] },
        async ({ event }) => {
            const { data } = event

            await prisma.user.update({
                where: {
                    id: data.id,
                },
                data: {
                    email: data?.email_addresses?.[0]?.email_address || '',
                    name: `${data?.first_name || ''} ${data?.last_name || ''}`.trim(),
                    image: data?.image_url || '',
                },
            })
        }
    ),
    inngest.createFunction(
        { id: 'sync-user-delete-from-clerk', triggers: [{ event: 'clerk/user.deleted' }] },
        async ({ event }) => {
            const { data } = event

            await prisma.user.delete({
                where: {
                    id: data.id,
                },
            })
        }
    ),
]
