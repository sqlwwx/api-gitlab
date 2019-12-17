const got = require('got')
const EventEmitter = require('events')
const { camelCaseObject, snakeCaseObject } = require('pure-func/lodash')
const { decamelize } = require('xcase')
const simpleExpireStore = require('pure-func/simpleExpireStore')
const debug = require('debug')('gitlab')
const QueryBuilder = require('./QueryBuilder')

const {
  GITLAB_TOKEN,
  GITLAB_ENDPOINT = 'https://gitlab.com/api/v4'
} = process.env

const defaultLoadToken = () => GITLAB_TOKEN

class Gitlab extends EventEmitter {
  tokenStore = simpleExpireStore({}, 60000 * 4)

  static get QueryBuilder () {
    return QueryBuilder
  }

  constructor (options = {}) {
    super()
    const { endpoint = GITLAB_ENDPOINT, loadToken } = options
    this.loadToken = loadToken || defaultLoadToken
    this.got = got.extend({
      timeout: 3000,
      prefixUrl: endpoint,
      headers: {
        'user-agent': 'gitlab-got'
      },
      hooks: {
        beforeRequest: [
          async requestOptions => {
            const { json, context: { key }, url: { searchParams } } = requestOptions
            if (json) {
              // eslint-disable-next-line no-param-reassign
              requestOptions.json = snakeCaseObject(json)
            }
            Array.from(searchParams.entries()).forEach(([name, value]) => {
              const decamelizeName = decamelize(name)
              if (name !== decamelizeName) {
                searchParams.set(decamelizeName, value)
                searchParams.delete(name)
              }
            })
            // eslint-disable-next-line no-param-reassign
            requestOptions.headers['PRIVATE-TOKEN'] = await this.loadTokenWithCache(key)
            debug(requestOptions.headers)
            return requestOptions
          }
        ],
        afterResponse: [
          response => {
            if (response.statusCode > 299) {
              this.emit('error', response)
              return response
            }
            if (!response.body) {
              return response
            }
            const data = JSON.parse(response.body)
            if (Array.isArray(data)) {
              response.body = data.map(camelCaseObject)
            }
            response.body = camelCaseObject(data)
            return response
          }
        ]
      }
    })
  }

  async request (url, options = {}) {
    return this.got(url, options).then(res => res.body)
  }

  async loadTokenWithCache (key = 'default') {
    let token = this.tokenStore[key]
    if (typeof token === 'undefined') {
      token = await this.loadToken(key)
      debug('loadToken', key, token)
      if (!token) {
        throw new Error(`loadToken Error ${key}`)
      }
      this.tokenStore[key] = token
    }
    return token
  }

  query (key = 'default') {
    return new this.constructor.QueryBuilder(this, key)
  }
}

module.exports = Gitlab
