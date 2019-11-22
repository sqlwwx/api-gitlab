# api-gitlab

```
const Gitlab = require('api-gitlab')

const gitlab = new Gitlab()

gitlab.query().project('lab/egg-sample').variables().list(0, 1000).then(ret => {
  console.log(ret)
  process.exit(0)
})
```
