const assert = require('assert')

class QueryBuilder {
  constructor (gitlab, key) {
    assert(gitlab)
    this.gitlab = gitlab
    this.key = key
  }

  request (url, config = {}) {
    // eslint-disable-next-line no-param-reassign
    config.context = config.context || {}
    // eslint-disable-next-line no-param-reassign
    config.context.key = this.key
    return this.gitlab.request(url, config)
  }

  group (name) {
    this.apiUrl = `groups/${encodeURIComponent(name)}`
    return this
  }

  project (name) {
    this.apiUrl = `projects/${encodeURIComponent(name)}`
    return this
  }

  resource (name) {
    if (!this.apiUrl) {
      this.apiUrl = name
    } else {
      this.apiUrl += `/${name}`
    }
    return this
  }

  variables () {
    assert(this.apiUrl)
    this.apiUrl += '/variables'
    return this
  }

  /**
   * list
   *
   * @param {number} page=1
   * @param {number} prePage=20 default: 20, max: 100
   * @returns {array}
   */
  list (page = 1, prePage = 20) {
    assert(this.apiUrl)
    return this.request(this.apiUrl, {
      searchParams: {
        per_page: prePage,
        page
      }
    })
  }

  delete (key) {
    assert(this.apiUrl)
    return this.request(`${this.apiUrl}/${key}`, { method: 'DELETE' })
  }

  create (json) {
    assert(this.apiUrl)
    return this.request(this.apiUrl, { method: 'POST', json })
  }

  update (key, json) {
    assert(this.apiUrl)
    return this.request(`${this.apiUrl}/${key}`, { method: 'PUT', json })
  }
}

module.exports = QueryBuilder
