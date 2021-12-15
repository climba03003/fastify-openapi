import t from 'tap'
import { mergeDocument } from '../../../lib/presets/openapi'

t.test('openapi mergeDocument', function (t) {
  t.plan(5)

  t.same(mergeDocument(''), {
    openapi: '3.0.3',
    info: {
      version: '0.0.0',
      title: ''
    },
    paths: {}
  })

  t.same(mergeDocument('', {}), {
    openapi: '3.0.3',
    info: {
      version: '0.0.0',
      title: ''
    },
    paths: {}
  })

  t.same(mergeDocument('', {}, {}), {
    openapi: '3.0.3',
    info: {
      version: '0.0.0',
      title: ''
    },
    paths: {}
  })

  t.same(mergeDocument('', { openapi: '3.1.0' }, {}), {
    openapi: '3.1.0',
    info: {
      version: '0.0.0',
      title: ''
    },
    paths: {}
  })

  t.same(mergeDocument('', { openapi: '3.1.0' }, { openapi: '3.1.1' }), {
    openapi: '3.1.1',
    info: {
      version: '0.0.0',
      title: ''
    },
    paths: {}
  })
})
