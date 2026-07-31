const test = require('node:test');
const assert = require('node:assert/strict');
const { formatTwitchChatMessage, normalizeChannel } = require('../gabberBridge');

test('normalizes a Twitch channel name', () => {
  assert.equal(normalizeChannel('thedorktrain'), '#thedorktrain');
  assert.equal(normalizeChannel('#thedorktrain'), '#thedorktrain');
});

test('formats a Discord message into a Twitch IRC PRIVMSG payload', () => {
  const message = formatTwitchChatMessage({
    content: 'hello world',
    channel: '#thedorktrain',
  });

  assert.equal(message, 'PRIVMSG #thedorktrain :hello world');
});
