import assert from 'node:assert/strict'
import test from 'node:test'
import { RecentPostRequests } from '../src/shared/recentPostRequests.ts'

const minute = 60_000
const start = new Date(1_800_000_000_000).toISOString()

test('does not intercept a recent POST attachment', () => {
  const posts = new RecentPostRequests()
  posts.note('https://opensource.samsung.com/downSrcCode', 1_800_000_000_000)
  assert.equal(
    posts.shouldKeepInBrowser(
      { url: 'https://opensource.samsung.com/downSrcCode', startTime: start },
      1_800_000_000_500
    ),
    true
  )
})

test('does not block unrelated GET files', () => {
  const posts = new RecentPostRequests()
  posts.note('https://opensource.samsung.com/downSrcCode', 1_800_000_000_000)
  assert.equal(
    posts.shouldKeepInBrowser(
      { url: 'https://example.org/linux.iso', startTime: start },
      1_800_000_000_500
    ),
    false
  )
})

test('recognizes final URL after redirects', () => {
  const posts = new RecentPostRequests()
  posts.note('https://example.org/attachment', 1_800_000_000_000)
  assert.equal(
    posts.shouldKeepInBrowser(
      {
        url: 'https://example.org/start',
        finalUrl: 'https://example.org/attachment',
        startTime: start
      },
      1_800_000_000_300
    ),
    true
  )
})

test('ignores expired and irrelevant earlier samples', () => {
  const posts = new RecentPostRequests()
  posts.note('https://example.org/file', 1_800_000_000_000)
  assert.equal(
    posts.shouldKeepInBrowser({ url: 'https://example.org/file' }, 1_800_000_000_000 + 6 * minute),
    false
  )
  posts.note('https://example.org/file', 1_800_000_000_000 + 7 * minute)
  assert.equal(
    posts.shouldKeepInBrowser(
      {
        url: 'https://example.org/file',
        startTime: new Date(1_800_000_000_000 + 9 * minute).toISOString()
      },
      1_800_000_000_000 + 9 * minute
    ),
    false
  )
})

test('bounds in-memory entries without storing POST bodies', () => {
  const posts = new RecentPostRequests()
  const now = 1_800_000_000_000
  for (let i = 0; i < 300; i++) posts.note(`https://example.org/${i}`, now)
  assert.equal(posts.shouldKeepInBrowser({ url: 'https://example.org/0' }, now + 1), false)
  assert.equal(posts.shouldKeepInBrowser({ url: 'https://example.org/299' }, now + 1), true)
})
