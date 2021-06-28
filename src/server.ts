import 'dotenv/config'
import express, { Request, Response } from 'express'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'
import Redis from 'ioredis'
import { Queue as QueueMQ, QueueScheduler, Worker } from 'bullmq'
import nodemailer from 'nodemailer'

import config from './config'

const app = express()

const redis = new Redis(process.env.REDIS_URL)

function createQueueMQ() {
  return new QueueMQ(config.mail.queueName, { connection: redis })
}

async function setupBullMQProcessor() {
  const queueScheduler = new QueueScheduler(config.mail.queueName, {
    connection: redis
  })

  await queueScheduler.waitUntilReady()

  new Worker(
    config.mail.queueName,
    async (job) => {
      const transporter = nodemailer.createTransport(config.mail.smtp)

      transporter.sendMail(job.data)
    },
    { connection: redis }
  )
}

async function run() {
  const queue = createQueueMQ()

  await setupBullMQProcessor()

  const serverAdapter = new ExpressAdapter()

  serverAdapter.setBasePath('/admin/queues')

  createBullBoard({
    queues: [new BullMQAdapter(queue)],
    serverAdapter
  })

  app.use(express.json())

  app.use('/admin/queues', serverAdapter.getRouter())

  app.use('/users', async (request: Request, response: Response) => {
    try {
      const { name, email, password } = request.body

      const user = {
        name,
        email,
        password
      }

      await queue.add('send-simple', {
        from: 'Queue Test <queue@queuetest.com.br>',
        subject: 'Cadastro de usuário',
        text: `Olá, ${user.name}, bem-vindo ao sistema de filas`,
        to: `${user.name} <${user.email}>`
      })
      return response.status(201).send()
    } catch (error) {
      return response.status(400).json({
        message: error.message
      })
    }
  })

  const port = process.env.PORT || 3333

  app.listen(port, () => {
    console.log(`Server started on port ${port}`)
  })
}

run().catch((e) => console.error(e))
