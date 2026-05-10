import cors from 'cors'
import express, { Request, Response, NextFunction } from 'express'
import { env } from './config/env'
import authRoutes from './routes/auth'
import catalogRoutes from './routes/catalog'
import cartRoutes from './routes/cart'
import orderRoutes from './routes/orders'
import reviewRoutes from './routes/reviews'
import searchRoutes from './routes/search'

const app = express()

app.use(
  cors({
    origin: env.frontendOrigin,
    credentials: true,
  }),
)
app.use(express.json())

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' })
})

app.use('/auth', authRoutes)
app.use(catalogRoutes)
app.use('/cart', cartRoutes)
// Reviews must be registered before orderRoutes: the orders router applies
// `requireAuth` at its root, and since it's mounted without a prefix, any
// router registered after it inherits that auth check on unmatched paths.
app.use(reviewRoutes)
app.use(searchRoutes)
app.use(orderRoutes)

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error.' })
})

app.listen(env.port, () => {
  console.log(`Mini Fleek backend listening on http://localhost:${env.port}`)
})
