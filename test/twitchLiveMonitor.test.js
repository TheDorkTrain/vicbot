const test = require('node:test');
const assert = require('node:assert/strict');
const { startTwitchLiveMonitor } = require('../twitchLiveMonitor');

function response(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  };
}

function createFetch(streamStates, onTokenRequest = () => {}) {
  let tokenRequests = 0;
  return {
    fetchImpl: async (url, options) => {
      const parsedUrl = new URL(url);
      if (parsedUrl.hostname === 'id.twitch.tv') {
        tokenRequests += 1;
        onTokenRequest(options);
        return response({ access_token: 'app-token', expires_in: 3600 });
      }
      if (parsedUrl.pathname.endsWith('/users')) {
        return response({ data: [{ id: 'twitch-user-id' }] });
      }
      if (parsedUrl.pathname.endsWith('/streams')) {
        return response({ data: streamStates.shift() ? [{ id: 'stream-id' }] : [] });
      }
      throw new Error(`Unexpected request: ${parsedUrl}`);
    },
    getTokenRequestCount: () => tokenRequests,
  };
}

function createDiscordClient() {
  const messages = [];
  return {
    messages,
    channels: {
      fetch: async (channelId) => ({
        isTextBased: () => true,
        send: async (message) => messages.push({ channelId, message }),
      }),
    },
  };
}

test('announces once when the channel transitions from offline to live', async () => {
  let tokenOptions;
  const { fetchImpl, getTokenRequestCount } = createFetch([false, true, true], (options) => {
    tokenOptions = options;
  });
  const discordClient = createDiscordClient();
  const monitor = startTwitchLiveMonitor({
    discordClient,
    clientId: 'client-id',
    clientSecret: 'client-secret',
    notificationChannelId: 'discord-general-id',
    fetchImpl,
    intervalMs: 60_000,
  });

  await monitor.initialPoll;
  await monitor.pollNow();
  await monitor.pollNow();
  monitor.stop();

  assert.deepEqual(discordClient.messages, [{
    channelId: 'discord-general-id',
    message: 'Yeeeehaa Rylee is firing up her Rodeo',
  }]);
  assert.equal(getTokenRequestCount(), 1);
  assert.equal(tokenOptions.method, 'POST');
  assert.equal(tokenOptions.headers['Content-Type'], 'application/x-www-form-urlencoded');
  assert.equal(new URLSearchParams(tokenOptions.body).get('client_id'), 'client-id');
  assert.equal(new URLSearchParams(tokenOptions.body).get('client_secret'), 'client-secret');
});

test('does not announce when the channel is already live at startup', async () => {
  const { fetchImpl } = createFetch([true, true]);
  const discordClient = createDiscordClient();
  const monitor = startTwitchLiveMonitor({
    discordClient,
    clientId: 'client-id',
    clientSecret: 'client-secret',
    notificationChannelId: 'discord-general-id',
    fetchImpl,
    intervalMs: 60_000,
  });

  await monitor.initialPoll;
  await monitor.pollNow();
  monitor.stop();

  assert.deepEqual(discordClient.messages, []);
});

test('includes Twitch error details when app authentication fails', async () => {
  const loggedErrors = [];
  const originalConsoleError = console.error;
  console.error = (...args) => loggedErrors.push(args);

  try {
    const monitor = startTwitchLiveMonitor({
      discordClient: createDiscordClient(),
      clientId: 'client-id',
      clientSecret: 'client-secret',
      notificationChannelId: 'discord-general-id',
      fetchImpl: async () => response({ status: 400, message: 'Invalid client secret.' }, 400),
      intervalMs: 60_000,
    });

    await monitor.initialPoll;
    monitor.stop();
  } finally {
    console.error = originalConsoleError;
  }

  assert.match(loggedErrors[0][1].message, /HTTP 400: Invalid client secret\./);
});
