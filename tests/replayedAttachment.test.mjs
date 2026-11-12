import assert from 'node:assert/strict'
import test from 'node:test'
import { isLikelyReplayedError } from '../src/shared/replayedAttachment.ts'

test('keeps Samsung ZIP if replay returns HTML', () => {
  assert.equal(isLikelyReplayedError('SM-P613_EUR_14_Opensource.zip', 'text/html; charset=utf-8', 785), true)
})

test('keeps Samsung ZIP if replay returns small JSON', () => {
  assert.equal(isLikelyReplayedError('SM-P613_EUR_14_Opensource.zip', 'application/json', 785), true)
})

test('allows a real binary response to go to Plexo', () => {
  assert.equal(isLikelyReplayedError('SM-P613_EUR_14_Opensource.zip', 'application/octet-stream', 233_492_856), false)
})

test('allows an intended HTML download', () => {
  assert.equal(isLikelyReplayedError('documentation.html', 'text/html', 785), false)
})

test('does not reject large text/plain responses based only on content type', () => {
  assert.equal(isLikelyReplayedError('archive.zip', 'text/plain', 33_000), false)
})
