import { Router } from 'express'
import { UsersController } from '../controllers/UsersController'

const usersRoutes = Router()

const usersController = new UsersController()

usersRoutes.post('/send-mail', usersController.sendMail)

export { usersRoutes }
