#!/usr/bin/env node

const ini = require('ini')
const assert = require('assert')

const Gitlab = require('..')

/* eslint-disable no-console */
const copyEnvs = async group => {
  const gitlab = new Gitlab()
  const variables = await gitlab
    .query()
    .group(group)
    .variables()
    .list(1, 100)
  console.log(ini.encode(variables.map(item => item)))
  process.exit(0)
}

const args = process.argv.splice(2)

assert(args[0], 'required group name')

copyEnvs(
  args[0]
)
