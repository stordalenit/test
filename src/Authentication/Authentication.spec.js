import { Types } from '../Core/Types'
import { AppTestHarness } from '../TestTools/AppTestHarness'
import { Router } from '../Routing/Router'
import { RouterRepository } from '../Routing/RouterRepository'
import { UserModel } from './UserModel'
import { GetSuccessfulRegistrationStub } from '../TestTools/GetSuccessfulRegistrationStub'
import { GetFailedRegistrationStub } from '../TestTools/GetFailedRegistrationStub'
import { GetSuccessfulUserLoginStub } from '../TestTools/GetSuccessfulUserLoginStub'
import { GetFailedUserLoginStub } from '../TestTools/GetFailedUserLoginStub'
import { MessagesRepository } from '../Core/Messages/MessagesRepository'

let appTestHarness = null
let router = null
let routerRepository = null
let routerGateway = null
let userModel = null
let messagesRepository = null
let onRouteChange = null

describe('init', () => {
  beforeEach(() => {
    appTestHarness = new AppTestHarness()
    appTestHarness.init()
    router = appTestHarness.container.get(Router)
    routerRepository = appTestHarness.container.get(RouterRepository)
    routerGateway = appTestHarness.container.get(Types.IRouterGateway)
    userModel = appTestHarness.container.get(UserModel)
    messagesRepository = appTestHarness.container.get(MessagesRepository)

    onRouteChange = () => {}
  })

  it('should be an null route', () => {
    expect(routerRepository.currentRoute.routeId).toBe(null)
  })

  describe('bootstrap', () => {
    beforeEach(() => {
      appTestHarness.bootStrap(onRouteChange)
    })

    it('should start at null route', () => {
      expect(routerRepository.currentRoute.routeId).toBe(null)
    })

    describe('routing', () => {
      it('should block wildcard *(default) routes when not logged in', () => {
        router.goToId('default')

        expect(routerGateway.goToId).toHaveBeenLastCalledWith('loginLink')
      })

      it('should block secure routes when not logged in', () => {
        router.goToId('homeLink')

        expect(routerGateway.goToId).toHaveBeenLastCalledWith('loginLink')
      })

      it('should allow public route when not logged in', () => {
        router.goToId('authorPolicyLink')

        expect(routerGateway.goToId).toHaveBeenLastCalledWith('authorPolicyLink')
      })
    })

    describe('register', () => {
      it('should show successful user message on successful register', async () => {
        const loginRegisterPresenter = await appTestHarness.setupLoginOrRegister(
          GetSuccessfulRegistrationStub,
          'register'
        )

        expect(loginRegisterPresenter.showValidationWarning).toBe(false)
        expect(loginRegisterPresenter.messages).toEqual(['User registered'])
      })

      it('should show failed server message on failed register', async () => {
        const loginRegisterPresenter = await appTestHarness.setupLoginOrRegister(GetFailedRegistrationStub, 'register')

        expect(loginRegisterPresenter.showValidationWarning).toBe(true)
        expect(loginRegisterPresenter.messages).toEqual([
          'Failed: credentials not valid must be (email and >3 chars on password).'
        ])
      })
    })

    describe('login', () => {
      it('should start at loginLink', async () => {
        router.goToId('homeLink')
        expect(routerRepository.currentRoute.routeId).toBe('loginLink')
      })

      it('should go to homeLink on successful login (and populate userModel)', async () => {
        await appTestHarness.setupLoginOrRegister(GetSuccessfulUserLoginStub)

        expect(routerGateway.goToId).toHaveBeenLastCalledWith('homeLink')
        expect(routerRepository.currentRoute.routeId).toBe('homeLink')

        expect(userModel.email).toBe('a@b.com')
        expect(userModel.token).toBe('a@b1234.com')
      })

      it('should update private route when successful login', async () => {
        router.goToId('homeLink')

        expect(!!userModel.token).toBe(false)
        expect(routerRepository.currentRoute.routeDef.isSecure).toBe(false)

        await appTestHarness.setupLoginOrRegister(GetSuccessfulUserLoginStub)

        expect(!!userModel.token).toBe(true)
        expect(routerRepository.currentRoute.routeDef.isSecure).toBe(true)
      })

      it('should not update route when failed login', async () => {
        router.goToId('homeLink')

        await appTestHarness.setupLoginOrRegister(GetFailedUserLoginStub)

        expect(routerRepository.currentRoute.routeId).toBe('loginLink')
      })

      it('should show failed user message on failed login', async () => {
        const loginRegisterPresenter = await appTestHarness.setupLoginOrRegister(GetFailedUserLoginStub)

        expect(loginRegisterPresenter.showValidationWarning).toBe(true)
        expect(loginRegisterPresenter.messages).toEqual(['Failed: no user record.'])
      })

      it('should clear messages on route change', () => {
        messagesRepository.appMessages = ['msg1', 'msg2']

        expect(messagesRepository.appMessages).toEqual(['msg1', 'msg2'])

        router.goToId('homeLink')

        expect(messagesRepository.appMessages).toEqual([])
      })

      it('should logout', async () => {
        const loginRegisterPresenter = await appTestHarness.setupLoginOrRegister(GetFailedUserLoginStub)

        await loginRegisterPresenter.logOut()

        expect(userModel.email).toBe('')
        expect(!!userModel.token).toBe(false)
        expect(routerRepository.currentRoute.routeId).toBe('loginLink')
      })
    })
  })
})
