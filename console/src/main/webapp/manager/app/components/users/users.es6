require('components/users/users.tpl')

require('services/users')
require('services/roles_users')
require('services/logs')
require('services/messages')

class UsersController {
  static $inject = ['$routeParams', '$injector', 'User', 'Role']

  constructor ($routeParams, $injector, User, Role) {
    this.$injector = $injector

    this.q = ''
    this.itemsPerPage = 25
    this.selection = []
    this.filterSelected = false

    this.newRole = this.$injector.get('$location').$$search.new === 'role'
    this.newRoleName = ''

    this.users = User.query(() => {
      this.allUsers = this.users.slice()
    })

    const active = $routeParams.id

    this.roles = Role.query()
    this.activePromise = this.roles.$promise.then(() => {
      this.activeRole = this.roles.filter(g => g.cn === active)[0]
      if (active === 'pending') {
        this.activeRole = {
          cn: 'PENDING',
          description: 'users.pending_desc'
        }
      }
      // filter users
      this.filter(this.activeRole)
      return this.activeRole
    })
    this.selectionFilter = this.selectionFilter.bind(this)
  }

  filter (role) {
    this.users.$promise.then(() => {
      // Display no pending users by default
      this.users = this.allUsers.filter(user => !user.pending)
      // Special case for pending
      if (role && role.cn === 'PENDING') {
        this.users = this.allUsers.filter(user => user.pending)
        return
      }
      this.users = this.allUsers.filter(
        user => (role.users.indexOf(user.uid) >= 0)
      )
    })
  }

  toggleSelected (uid) {
    if (this.selection.indexOf(uid) >= 0) {
      this.selection = this.selection.filter(id => id !== uid)
    } else {
      this.selection.push(uid)
    }
  }

  select (sel) {
    const filter = this.$injector.get('$filter')('filter')
    switch (sel) {
      case 'all':
        this.selection = filter(this.users, this.q).map(u => u.uid)
        break
      case 'none':
        this.selection = []
        break
    }
  }

  selectionFilter (u) {
    return (this.filterSelected)
      ? this.selection.indexOf(u.uid) >= 0
      : true
  }

  export_ (fileType) {
    const download = this.$injector.get(`Export${fileType.toUpperCase()}`)
    download(this.selection).then(result => {
      if (result.status !== 200) {
        throw new Error(`Cannot fetch users list. error ${result.status}`)
      }
      let mimetype = ''
      switch (fileType) {
        case 'vcf':
          mimetype = 'text/x-vcard'
          break
        default:
          mimetype = `text/${fileType}`
      }
      const blob = new Blob(['\ufeff', result.data], { type: mimetype })
      const a = document.createElement('a')
      a.href = window.URL.createObjectURL(blob)
      a.target = '_blank'
      const filter = this.$injector.get('$filter')
      const date = filter('date')(new Date(), 'yyyyMMdd-HHmmss')
      a.download = `${date}_users_export.${fileType}`
      document.body.appendChild(a) // create the link "a"
      a.click() // click the link "a"
      document.body.removeChild(a)
    }).catch(err => {
      const flash = this.$injector.get('Flash')
      flash.create('danger', err)
    })
  }

  exportCSV () {
    this.export_('csv')
  }

  exportVCF () {
    this.export_('vcf')
  }

  close () {
    this.newRole = false
    this.newRoleName = ''
    const $location = this.$injector.get('$location')
    $location.url($location.path())
  }

  saveRole () {
    const flash = this.$injector.get('Flash')
    const $router = this.$injector.get('$router')
    const $location = this.$injector.get('$location')
    const $httpDefaultCache = this.$injector.get('$cacheFactory').get('$http')

    const role = new (this.$injector.get('Role'))()
    role.cn = this.newRoleName
    role.description = this.newRoleDesc

    role.$save(
      () => {
        flash.create('success', this.i18n.created)
        $httpDefaultCache.removeAll()
        $router.navigate($router.generate('users', { id: role.cn }))
        $location.url($location.path())
      },
      flash.create.bind(flash, 'danger', this.i18n.error)
    )
  }

  activate ($scope) {
    const $location = this.$injector.get('$location')
    $scope.$watch(() => $location.search().new, (v) => {
      this.newRole = v === 'role'
    })
  }
}

UsersController.prototype.activate.$inject = ['$scope']

angular.module('manager')
  .controller('UsersController', UsersController)
  .directive('validateRole', () => ({
    require: 'ngModel',
    link: (scope, elm, attrs, ctrl) => {
      ctrl.$validators.validateRole = (modelValue, viewValue) => {
        const roles = scope.$eval(attrs.validateRole)
        const prefix = viewValue.substr(0, viewValue.lastIndexOf('_'))
        return prefix === '' || roles.some(g => g.cn === prefix)
      }
    }
  }))
