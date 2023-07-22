import { NavigationPresenter } from './NavigationPresenter'
import { Router } from '../Routing/Router'
import { Types } from '../Core/Types'
import { AppTestHarness } from '../TestTools/AppTestHarness'
import { GetSuccessfulRegistrationStub } from '../TestTools/GetSuccessfulRegistrationStub'

let appTestHarness = null
let navigationPresenter = null
let router = null
let routerGateway = null

describe('navigation', () => {
  beforeEach(async () => {
    appTestHarness = new AppTestHarness()
    appTestHarness.init()
    appTestHarness.bootStrap(() => {})
    navigationPresenter = appTestHarness.container.get(NavigationPresenter)
    router = appTestHarness.container.get(Router)
    routerGateway = appTestHarness.container.get(Types.IRouterGateway)
  })

  describe('before login', () => {
    it('anchor default state', () => {
      expect(navigationPresenter.viewModel.currentSelectedVisibleName).toBe('')
      expect(navigationPresenter.viewModel.showBack).toBe(false)
      expect(navigationPresenter.viewModel.menuItems).toEqual([])
    })
  })

  describe('login', async () => {
    beforeEach(async () => {
      await appTestHarness.setupLoginOrRegister(GetSuccessfulRegistrationStub)
    })

    it('should navigate down the navigation tree', async () => {
      expect(navigationPresenter.viewModel.currentSelectedVisibleName).toBe('Home > homeLink')
      expect(navigationPresenter.viewModel.showBack).toBe(false)
      expect(navigationPresenter.viewModel.menuItems).toEqual([
        {
          id: 'booksLink',
          visibleName: 'Books'
        },
        {
          id: 'authorsLink',
          visibleName: 'Authors'
        }
      ])

      router.goToId('booksLink')
      expect(navigationPresenter.viewModel.currentSelectedVisibleName).toBe('Books > booksLink')
      expect(navigationPresenter.viewModel.showBack).toBe(true)
      expect(navigationPresenter.viewModel.menuItems).toEqual([])

      router.goToId('authorsLink')
      expect(navigationPresenter.viewModel.currentSelectedVisibleName).toBe('Authors > authorsLink')
      expect(navigationPresenter.viewModel.showBack).toBe(true)
      expect(navigationPresenter.viewModel.menuItems).toEqual([
        {
          id: 'authorsLink-authorPolicyLink',
          visibleName: 'Author Policy'
        },
        {
          id: 'authorsLink-mapLink',
          visibleName: 'View Map'
        }
      ])

      router.goToId('authorsLink-authorPolicyLink')
      expect(navigationPresenter.viewModel.currentSelectedVisibleName).toBe(
        'Author Policy > authorsLink-authorPolicyLink'
      )
      expect(navigationPresenter.viewModel.showBack).toBe(true)
      expect(navigationPresenter.viewModel.menuItems).toEqual([])

      router.goToId('authorsLink-mapLink')
      expect(navigationPresenter.viewModel.currentSelectedVisibleName).toBe('View Map > authorsLink-mapLink')
      expect(navigationPresenter.viewModel.showBack).toBe(true)
      expect(navigationPresenter.viewModel.menuItems).toEqual([])
    })

    it('should move back twice', () => {
      router.goToId('authorsLink')
      expect(navigationPresenter.viewModel.currentSelectedVisibleName).toBe('Authors > authorsLink')
      expect(navigationPresenter.viewModel.showBack).toBe(true)
      expect(navigationPresenter.viewModel.menuItems).toEqual([
        {
          id: 'authorsLink-authorPolicyLink',
          visibleName: 'Author Policy'
        },
        {
          id: 'authorsLink-mapLink',
          visibleName: 'View Map'
        }
      ])

      router.goToId('authorsLink-mapLink')
      expect(navigationPresenter.viewModel.currentSelectedVisibleName).toBe('View Map > authorsLink-mapLink')
      expect(navigationPresenter.viewModel.showBack).toBe(true)
      expect(navigationPresenter.viewModel.menuItems).toEqual([])

      navigationPresenter.back()
      navigationPresenter.back()

      expect(navigationPresenter.viewModel.currentSelectedVisibleName).toBe('Home > homeLink')
      expect(navigationPresenter.viewModel.showBack).toBe(false)
      expect(navigationPresenter.viewModel.menuItems).toEqual([
        {
          id: 'booksLink',
          visibleName: 'Books'
        },
        {
          id: 'authorsLink',
          visibleName: 'Authors'
        }
      ])
    })
  })
})
