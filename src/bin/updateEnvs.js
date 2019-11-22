#!/usr/bin/env node

const { isEqual } = require('lodash')
const Gitlab = require('./Gitlab')

const buildEnv = (text, environmentScope = '*') => text.split('\n').map(item => {
  const [key, value] = item.split(/\s+/)
  return {
    key,
    value,
    variable_type: 'env_var',
    protected: true,
    masked: false,
    environmentScope
  }
})

const setShouldDelete = items => {
  items.filter(item => item.isExisted && !item.shouldDelete).forEach(item => {
    Object.defineProperties(item, {
      shouldDelete: { value: true, enumerable: false }
    })
  })
}

const deleteVariables = async (items, deleteVariable) => {
  await items.filter(item => item.shouldDelete).reduce((promise, item) => {
    console.log('deleteVariables', item.key)
    return promise.then(() => {
      return deleteVariable(item.key)
    })
  }, Promise.resolve())
}

const createVariables = async (items, createVariable) => {
  await items.filter(item => item.shouldCreate).reduce((promise, item) => {
    return promise.then(() => {
      console.log('createVariables', item)
      return createVariable(item).catch(err => console.error(err.context.body))
    })
  }, Promise.resolve())
}

const start = async (project, allEnv) => {
  const envs = [
    ...buildEnv(allEnv.commom),
    ...buildEnv(allEnv.pre, 'pre'),
    ...buildEnv(allEnv.production, 'production')
  ]
  const gitlab = new Gitlab()
  const variableApi = gitlab.key('wwx').project(project).variables()
  const variables = (await variableApi.list()).reduce((result, item) => {
    const { key, environmentScope } = item
    Object.defineProperties(item, {
      isExisted: { value: true, enumerable: false }
    })
    if (result[key]) {
      // eslint-disable-next-line no-param-reassign
      result[key][environmentScope] = item
    } else {
      // eslint-disable-next-line no-param-reassign
      result[key] = { [environmentScope]: item }
    }
    return result
  }, {})
  envs.forEach(item => {
    const { key, environmentScope } = item
    const keyGroup = variables[key]
    if (!keyGroup) {
      console.log('no keyGroup', key)
      Object.defineProperties(item, {
        shouldCreate: { value: true, enumerable: false }
      })
      variables[key] = { [environmentScope]: item }
      return
    }
    const exist = keyGroup[environmentScope]
    if (exist) {
      if (isEqual(exist, item)) {
        return
      }
      Object.defineProperties(item, {
        isExisted: { value: true, enumerable: false }
      })
    }
    Object.defineProperties(item, {
      shouldCreate: { value: true, enumerable: false }
    })
    keyGroup[environmentScope] = item
    setShouldDelete(Object.values(keyGroup))
  })
  await Object.values(variables).reduce(async (promise, keyGroup) => {
    await promise
    await deleteVariables(Object.values(keyGroup), key => variableApi.delete(key))
  }, Promise.resolve())
  await Object.values(variables).reduce(async (promise, keyGroup) => {
    await promise
    await createVariables(Object.values(keyGroup), json => variableApi.create(json))
  }, Promise.resolve())
  process.exit(0)
}

const args = process.argv.splice(2)

start('crm/wechat-api', require(`./${args[0]}`))
