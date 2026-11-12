const TWITCH_API_BASE = 'https://api.twitch.tv/helix';
const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';

async function readTwitchResponse(response, operation) {
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`${operation} returned an invalid response (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    const detail = typeof data.message === 'string' ? `: ${data.message}` : '';
    throw new Error(`${operation} failed with HTTP ${response.status}${detail}`);
  }

  return data;
}

function startTwitchLiveMonitor({
  discordClient,
  clientId,
  clientSecret,
  notificationChannelId,
  channelLogin = 'ryyyleeeeee',
  intervalMs = 60_000,
  fetchImpl = fetch,
}) {
  if (!clientId || !clientSecret) {
    console.error('Twitch live notifications require twitchClientId and twitchClientSecret in config.json.');
    return null;
  }

  if (!notificationChannelId) {
    console.error('Twitch live notifications require twitchLiveNotificationChannelId in config.json.');
    return null;
  }

  let accessToken;
  let tokenExpiresAt = 0;
  let channelUserId;
  let previousLiveState = null;
  let pollInProgress = false;

  async function getAccessToken() {
    if (accessToken && Date.now() < tokenExpiresAt) return accessToken;

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    });
    const response = await fetchImpl(TWITCH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = await readTwitchResponse(response, 'Twitch app-token request');
    if (!data.access_token || !data.expires_in) {
      throw new Error('Twitch app-token response did not include a token and expiration.');
    }

    accessToken = data.access_token;
    tokenExpiresAt = Date.now() + Math.max(0, data.expires_in - 60) * 1000;
    return accessToken;
  }

  async function fetchTwitchApi(url, retry = true) {
    const token = await getAccessToken();
    const response = await fetchImpl(url, {
      headers: {
        'Client-Id': clientId,
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401 && retry) {
      accessToken = null;
      tokenExpiresAt = 0;
      return fetchTwitchApi(url, false);
    }
    return readTwitchResponse(response, 'Twitch API request');
  }

  async function getChannelUserId() {
    if (channelUserId) return channelUserId;

    const url = new URL(`${TWITCH_API_BASE}/users`);
    url.searchParams.set('login', channelLogin);
    const data = await fetchTwitchApi(url);
    channelUserId = data.data?.[0]?.id;
    if (!channelUserId) {
      throw new Error(`Twitch channel "${channelLogin}" was not found.`);
    }
    return channelUserId;
  }

  async function poll() {
    if (pollInProgress) return;
    pollInProgress = true;

    try {
      const userId = await getChannelUserId();
      const url = new URL(`${TWITCH_API_BASE}/streams`);
      url.searchParams.set('user_id', userId);
      const data = await fetchTwitchApi(url);
      const isLive = data.data?.length > 0;

      if (previousLiveState === false && isLive) {
        const channel = await discordClient.channels.fetch(notificationChannelId);
        if (!channel?.isTextBased?.() || typeof channel.send !== 'function') {
          throw new Error(`Discord notification channel ${notificationChannelId} is not a text channel.`);
        }
        await channel.send('Yeeeehaa Rylee is firing up her Rodeo');
      }

      previousLiveState = isLive;
    } catch (error) {
      console.error('Failed to check Twitch live status or send its Discord notification.', error);
    } finally {
      pollInProgress = false;
    }
  }

  const initialPoll = poll();
  const timer = setInterval(() => {
    void poll();
  }, intervalMs);
  timer.unref?.();

  return {
    initialPoll,
    pollNow: poll,
    stop: () => clearInterval(timer),
  };
}

module.exports = { startTwitchLiveMonitor };
