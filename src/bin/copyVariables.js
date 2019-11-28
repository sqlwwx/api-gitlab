#!/usr/bin/env node

const { isEqual } = require('lodash')
const Gitlab = require('.')

const copyEnvs = async (originGroup, distGroup) => {
  const gitlab = new Gitlab()
  const originVariableApi = gitlab.key('wwx').group(originGroup).variables()
  const distVariableApi = gitlab.key('wwx').group(distGroup).variables()

  const originVariables = (await originVariableApi.list()).reduce((obj, item) => ({ ...obj, [item.key]: item }), {})
  const distVariables = (await distVariableApi.list()).reduce((obj, item) => ({ ...obj, [item.key]: item }), {})
  await Object.values(originVariables).reduce(async (promise, item) => {
    await promise
    if (!distVariables[item.key]) {
      return distVariableApi.create(item)
    }
    if (isEqual(distVariables[item.key], item)) {
      console.log('isEqual', item.key)
      return Promise.resolve()
    }
    console.log('not equal', item.key)
  }, Promise.resolve())
  process.exit(0)
}

copyEnvs('tt', 'crm')
