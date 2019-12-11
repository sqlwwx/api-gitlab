#!/usr/bin/env node

const fs = require('fs')
const ini = require('ini')
const { isEqual } = require('lodash')
const Gitlab = require('..')

const readIni = filePath => ini.parse(fs.readFileSync(filePath, 'utf-8'))

const setShouldDelete = items => {
  items.filter(item => item.isExisted && !item.shouldDelete).forEach(item => {
    Object.defineProperties(item, {
      shouldDelete: { value: true, enumerable: false }
    })
  })
}

const start = async () => {
  const gitlab = new Gitlab()
  const [group, envIni] = process.argv.splice(2)
  const originVariableApi = gitlab.query().group(group).variables()
  const toUpdateVariables = Object.values(readIni(envIni))
  const originVariables = (
    await originVariableApi.list(1, 100)
  ).reduce((obj, item) => ({ ...obj, [item.key]: item }), {})
  await toUpdateVariables.reduce(async (promise, variable) => {
    await promise
    const originVariable = originVariables[variable.key]
    if (!originVariable) {
      await originVariableApi.create(variable)
      console.log('createdVariable', variable)
      return Promise.resolve()
    }
    if (!isEqual(variable, originVariable)) {
      await originVariableApi.update(variable.key, variable)
      console.log('updated', variable)
    }
  }, Promise.resolve())
  process.exit(0)
}

start()
