const test = require('node:test');
const assert = require('node:assert/strict');
const { formatIrcMessage, sanitizeNick } = require('../gabberBridge');

test('sanitizes a Discord display name for Twitch-style nick handling', () => {
  assert.equal(sanitizeNick('Vic The Bot'), 'vic_the_bot');
  assert.equal(sanitizeNick('Cool-User_42'), 'cool-user_42');
});

test('formats a Discord message into a Twitch IRC PRIVMSG', () => {
  const message = formatIrcMessage({
    username: 'Vic',
    displayName: 'Vic The Bot',
    content: 'hello world',
    userId: '123',
    roomId: '456',
  });

  assert.match(message, /^@badge-info=;badges=;color=;display-name=Vic The Bot;emotes=;flags=;id=[^;]+;mod=0;room-id=456;subscriber=0;tmi-sent-ts=\d+;turbo=0;user-id=123;user-type= :vic_the_bot!vic_the_bot@vic_the_bot\.tmi\.twitch\.tv PRIVMSG #discord :hello world\r\n$/);
});
