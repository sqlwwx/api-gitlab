#!/usr/bin/env node

/* eslint-disable no-console */

const assert = require('assert')

const Gitlab = require('..')

const copyEnvs = async project => {
  const gitlab = new Gitlab()
  const variables = await gitlab
    .query()
    .project(project)
    .variables()
    .list(1, 100)
  const groupedVariables = (
    await gitlab.query().project(project).variables().list(1, 100)
  ).reduce((groups, item) => {
    const { environmentScope } = item
    // eslint-disable-next-line no-param-reassign
    groups[environmentScope] = [].concat(groups[environmentScope] || [], item)
    return groups
  }, {})
  console.log(`; ${project} ${variables.length} variables`)
  Object.entries(groupedVariables).forEach(([scope, items]) => {
    console.log(`[${scope}]`)
    console.log(items.map(({
      key,
      value
    }) => `${key}="${value}"`).join('\n'))
  })
  process.exit(0)
}

const args = process.argv.splice(2)

assert(args[0], 'required project name')

copyEnvs(
  args[0]
)
