import 'dotenv/config'
import express, { Request, Response } from 'express'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'
import Redis from 'ioredis'
import { Queue as QueueMQ, QueueScheduler, Worker } from 'bullmq'
import nodemailer from 'nodemailer'
import fetch from 'node-fetch'

import config from './config'

const app = express()

const redis = new Redis(process.env.REDIS_URL)

function createQueueMQ(name: string) {
  return new QueueMQ(name, { connection: redis })
}

async function setupBullMQProcessor() {
  const queueScheduler = new QueueScheduler(config.mail.queueName, {
    connection: redis
  })

  const delayQueueScheduler = new QueueScheduler('delay', {
    connection: redis
  })

  await queueScheduler.waitUntilReady()

  await delayQueueScheduler.waitUntilReady()

  new Worker(
    config.mail.queueName,
    async (job) => {
      const transporter = nodemailer.createTransport(config.mail.smtp)

      transporter.sendMail(job.data)
    },
    { connection: redis }
  )

  new Worker(
    'delay',
    async (job) => {
      const responses = []

      for (let i = 0; i < job.data.count; i++) {
        responses.push(
          await fetch(`http://httpbin.org/delay/${job.data.delay}`)
        )
      }

      return responses
    },
    { connection: redis }
  )

  new Worker(
    'delay',
    async (job) => {
      const responses = []

      for (let i = 0; i < job.data.count; i++) {
        responses.push(
          await fetch(`http://httpbin.org/delay/${job.data.delay}`)
        )
      }

      return responses
    },
    { connection: redis }
  )

  new Worker(
    'delay',
    async (job) => {
      const responses = []

      for (let i = 0; i < job.data.count; i++) {
        responses.push(
          await fetch(`http://httpbin.org/delay/${job.data.delay}`)
        )
      }

      return responses
    },
    { connection: redis }
  )

  new Worker(
    'delay',
    async (job) => {
      const responses = []

      for (let i = 0; i < job.data.count; i++) {
        responses.push(
          await fetch(`http://httpbin.org/delay/${job.data.delay}`)
        )
      }

      return responses
    },
    { connection: redis }
  )

  new Worker(
    'delay',
    async (job) => {
      const responses = []

      for (let i = 0; i < job.data.count; i++) {
        responses.push(
          await fetch(`http://httpbin.org/delay/${job.data.delay}`)
        )
      }

      return responses
    },
    { connection: redis }
  )

  new Worker(
    'delay',
    async (job) => {
      const responses = []

      for (let i = 0; i < job.data.count; i++) {
        responses.push(
          await fetch(`http://httpbin.org/delay/${job.data.delay}`)
        )
      }

      return responses
    },
    { connection: redis }
  )
}

async function run() {
  const queue = createQueueMQ(config.mail.queueName)

  const delayQueue = createQueueMQ('delay')

  await setupBullMQProcessor()

  const serverAdapter = new ExpressAdapter()

  serverAdapter.setBasePath('/admin/queues')

  createBullBoard({
    queues: [new BullMQAdapter(queue), new BullMQAdapter(delayQueue)],
    serverAdapter
  })

  app.use(express.json())

  app.use('/admin/queues', serverAdapter.getRouter())

  app.use('/delay', async (request: Request, response: Response) => {
    const { delay, count } = request.query

    await delayQueue.add('delay-job', {
      delay,
      count
    })

    return response.status(201).send()
  })

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
        subject: 'Cadastro de usu??rio',
        text: `Ol??, ${user.name}, bem-vindo ao sistema de filas`,
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
