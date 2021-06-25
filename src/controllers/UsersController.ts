import { Request, Response } from 'express'
import { Worker, Job, Queue } from 'bullmq'
import nodemailer from 'nodemailer'

import config from '../config'
import { MailDTO } from '../dtos/MailDTO'

class UsersController {
  async sendMail(request: Request, response: Response): Promise<Response> {
    try {
      const { name, email, password } = request.body

      const user = {
        name,
        email,
        password
      }

      const queue = new Queue<MailDTO>(config.mail.queueName, {
        connection: config.redis.connection
      })

      await queue.add('send-simple', {
        from: 'Queue Test <queue@queuetest.com.br>',
        subject: 'Cadastro de usuário',
        text: `Olá, ${user.name}, bem-vindo ao sistema de filas`,
        to: `${user.name} <${user.email}>`
      })

      const worker = new Worker(config.mail.queueName, async (job: Job) => {
        if (config.mail.smtp.host) {
          const transporter = nodemailer.createTransport(config.mail.smtp)

          transporter.sendMail(job.data)
        }
      })

      worker.on('completed', (job) => {
        console.log(
          `Completed job ${job.id} successfully, sent email to ${job.data.to}`
        )
      })

      worker.on('failed', (job: Job, err: any) =>
        console.log(`Failed job ${job.id} with ${err}`)
      )

      return response.status(201).send()
    } catch (error) {
      return response.status(400).json({
        message: error.message
      })
    }
  }
}

export { UsersController }
