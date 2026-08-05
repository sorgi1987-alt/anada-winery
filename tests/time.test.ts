import test from 'node:test'
import assert from 'node:assert/strict'
import { formatRelativeTime, formatZonedDateTime, isValidTimeZone } from '../src/time'

test('validates IANA winery time zones', () => { assert.equal(isValidTimeZone('Europe/Madrid'), true); assert.equal(isValidTimeZone('Not/AZone'), false) })
test('formats operational instants in the configured winery timezone', () => { const value=formatZonedDateTime('2026-01-15T12:00:00Z','en-GB','Europe/Madrid'); assert.match(value,/13:00/) })
test('renders relative operational time without replacing the exact timestamp', () => { assert.equal(formatRelativeTime('2026-08-05T12:29:00Z','en',new Date('2026-08-05T12:30:00Z')),'1 minute ago') })
