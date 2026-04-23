import express from 'express'
import cors from 'cors'
import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express'
import { serve } from 'inngest/express'
import { prisma } from './db.js'
import { config } from './config.js'
import { inngest, functions } from '../ingest/index.js'

const app = express()
const port = config.port

app.use(
    cors({
        origin: true,
        credentials: true,
    })
)
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

app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`)
})
