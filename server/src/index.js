import express from 'express'
import cors from 'cors'
import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express'
import { serve } from 'inngest/express'
import { Webhook } from 'standardwebhooks'
import { prisma } from './db.js'
import { config } from './config.js'
import { inngest, functions } from '../ingest/index.js'

const app = express()

app.use(
    cors({
        origin: true,
        credentials: true,
    })
)

app.post('/api/clerk/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        if (!config.clerkWebhookSecret) {
            return res.status(500).json({ ok: false, message: 'Missing Clerk webhook secret' })
        }

        const wh = new Webhook(config.clerkWebhookSecret)
        const payload = wh.verify(req.body.toString('utf8'), {
            'webhook-id': req.headers['svix-id'],
            'webhook-timestamp': req.headers['svix-timestamp'],
            'webhook-signature': req.headers['svix-signature'],
        })
        const eventType = payload?.type
        const userData = payload?.data
        const eventName = `clerk/${eventType}`

        if (!eventType || !userData?.id) {
            return res.status(400).json({ ok: false, message: 'Invalid Clerk webhook payload' })
        }

        if (eventType === 'user.created' || eventType === 'user.updated') {
            await prisma.user.upsert({
                where: { id: userData.id },
                create: {
                    id: userData.id,
                    email: userData?.email_addresses?.[0]?.email_address || '',
                    name: `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim(),
                    image: userData?.image_url || '',
                },
                update: {
                    email: userData?.email_addresses?.[0]?.email_address || '',
                    name: `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim(),
                    image: userData?.image_url || '',
                },
            })
        }

        if (eventType === 'user.deleted') {
            await prisma.user.deleteMany({
                where: { id: userData.id },
            })
        }

        await inngest.send({
            name: eventName,
            data: userData,
        })

        return res.json({ ok: true })
    } catch (error) {
        console.error('Clerk webhook error:', error)
        return res.status(400).json({ ok: false, message: 'Webhook processing failed' })
    }
})

app.use(express.json())
app.use(clerkMiddleware())
app.use('/api/inngest', serve({ client: inngest, functions }))

app.get('/health', (req, res) => {
    res.json({ ok: true, message: 'Server is running' })
})

app.get('/api/projects', requireAuth(), async (req, res, next) => {
    try {
        const projects = await prisma.project.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
        })

        res.json({ ok: true, projects })
    } catch (error) {
        next(error)
    }
})

app.get('/api/me', requireAuth(), (req, res) => {
    const auth = getAuth(req)
    res.json({
        ok: true,
        userId: auth.userId || null,
        sessionId: auth.sessionId || null,
    })
})

app.get('/', (req, res) => {
    res.json({ ok: true, name: 'Project Management API' })
})

app.use((error, req, res, next) => {
    console.error(error)
    res.status(500).json({ ok: false, message: 'Internal server error' })
})

export { app }

if (process.env.VERCEL !== '1') {
    const port = config.port

    app.listen(port, () => {
        console.log(`Server listening on http://localhost:${port}`)
    })
}
