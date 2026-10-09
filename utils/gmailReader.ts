const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me/messages';
const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const LOGIN_OTP_SUBJECT = 'Your Login OTP';
const POLL_INTERVAL = 5_000;

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailMessagePart {
  body?: { data?: string };
  headers?: GmailHeader[];
  parts?: GmailMessagePart[];
}

interface GmailMessage {
  id: string;
  internalDate?: string;
  snippet?: string;
  payload?: GmailMessagePart;
}

interface GmailMessageList {
  messages?: Array<{ id: string }>;
}

interface GmailOAuthCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

interface GmailOAuthTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

export interface GmailMessageSummary {
  id: string;
  internalDate: number;
  subject: string;
  snippet: string;
}

interface NewMailOptions {
  recipient: string;
  previousMessageId?: string;
  requestedAt: number;
}

export function extractOtp(snippet: string): string {
  const otpMatch = snippet.match(/\b\d{4}\b/);

  if (!otpMatch) {
    throw new Error('The new OTP email snippet has no 4-digit OTP.');
  }

  return otpMatch[0];
}

export class GmailReader {
  private readonly configuredAccessToken?: string;
  private readonly oauthCredentials?: GmailOAuthCredentials;
  private cachedAccessToken?: string;
  private cachedAccessTokenExpiresAt = 0;

  constructor() {
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

    if (clientId && clientSecret && refreshToken) {
      this.oauthCredentials = { clientId, clientSecret, refreshToken };
      return;
    }

    this.configuredAccessToken = process.env.GMAIL_ACCESS_TOKEN;

    if (!this.configuredAccessToken) {
      throw new Error(
        'Gmail authentication is missing. Configure GMAIL_CLIENT_ID, ' +
          'GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN, or provide ' +
          'GMAIL_ACCESS_TOKEN for a temporary local run.',
      );
    }
  }

  async getLatestOtpMessage(
    recipient: string,
  ): Promise<GmailMessageSummary | undefined> {
    const messages = await this.getMessageSummaries(
      `to:${recipient} subject:"${LOGIN_OTP_SUBJECT}" newer_than:2d`,
    );

    return messages.find((message) =>
      message.subject.includes(LOGIN_OTP_SUBJECT),
    );
  }

  async getLatestMessageForRecipient(
    recipient: string,
  ): Promise<GmailMessageSummary | undefined> {
    const messages = await this.getMessageSummaries(
      `to:${recipient} newer_than:2d`,
    );

    return messages[0];
  }

  async waitForNewOtp(options: NewMailOptions): Promise<string> {
    const deadline = Date.now() + 300_000;
    let nextStatusTime = Date.now();

    while (Date.now() < deadline) {
      if (Date.now() >= nextStatusTime) {
        console.log('Waiting for a new login OTP email...');
        nextStatusTime = Date.now() + 30_000;
      }

      const messages = await this.getMessageSummaries(
        `to:${options.recipient} subject:"${LOGIN_OTP_SUBJECT}" newer_than:2d`,
      );
      const newOtpMessage = messages.find(
        (message) =>
          message.id !== options.previousMessageId &&
          message.internalDate >= options.requestedAt &&
          message.subject.includes(LOGIN_OTP_SUBJECT),
      );

      if (newOtpMessage) {
        console.log('New login OTP email received.');
        return extractOtp(newOtpMessage.snippet);
      }

      await this.wait(POLL_INTERVAL);
    }

    throw new Error('A new login OTP email was not received within 5 minutes.');
  }

  async waitForNewResetLink(options: NewMailOptions): Promise<string> {
    const deadline = Date.now() + 600_000;
    let nextStatusTime = Date.now();

    while (Date.now() < deadline) {
      if (Date.now() >= nextStatusTime) {
        console.log('Waiting for a new password reset email...');
        nextStatusTime = Date.now() + 30_000;
      }

      const messages = await this.getMessageSummaries(
        `to:${options.recipient} newer_than:2d`,
      );
      const newMessages = messages.filter(
        (message) =>
          message.id !== options.previousMessageId &&
          message.internalDate >= options.requestedAt,
      );

      for (const message of newMessages) {
        const fullMessage = await this.getMessage(message.id, 'full');
        const resetLink = this.extractResetLink(fullMessage);

        if (resetLink) {
          console.log('New password reset email received.');
          return resetLink;
        }
      }

      await this.wait(POLL_INTERVAL);
    }

    throw new Error(
      'A new password reset email was not received within 10 minutes.',
    );
  }

  private async getMessageSummaries(
    query: string,
  ): Promise<GmailMessageSummary[]> {
    const url = new URL(GMAIL_API);
    url.searchParams.set('q', query);
    url.searchParams.set('maxResults', '20');

    const list = await this.getJson<GmailMessageList>(url);
    const messages = await Promise.all(
      (list.messages ?? []).map(({ id }) => this.getMessage(id, 'metadata')),
    );

    return messages
      .map((message) => this.toSummary(message))
      .sort((first, second) => second.internalDate - first.internalDate);
  }

  private async getMessage(
    messageId: string,
    format: 'metadata' | 'full',
  ): Promise<GmailMessage> {
    const url = new URL(`${GMAIL_API}/${messageId}`);
    url.searchParams.set('format', format);

    return this.getJson<GmailMessage>(url);
  }

  private async getJson<T>(url: URL): Promise<T> {
    let response = await this.fetchGmailApi(url);

    if (response.status === 401 && this.oauthCredentials) {
      this.cachedAccessToken = undefined;
      this.cachedAccessTokenExpiresAt = 0;
      response = await this.fetchGmailApi(url);
    }

    if (!response.ok) {
      throw new Error(
        `Gmail API request failed with status ${response.status}: ${await response.text()}`,
      );
    }

    return (await response.json()) as T;
  }

  private async fetchGmailApi(url: URL): Promise<Response> {
    const accessToken = await this.getAccessToken();

    return fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  private async getAccessToken(): Promise<string> {
    if (!this.oauthCredentials) {
      return this.configuredAccessToken!;
    }

    if (
      this.cachedAccessToken &&
      Date.now() < this.cachedAccessTokenExpiresAt
    ) {
      return this.cachedAccessToken;
    }

    const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.oauthCredentials.clientId,
        client_secret: this.oauthCredentials.clientSecret,
        refresh_token: this.oauthCredentials.refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    const tokenData = (await response.json()) as GmailOAuthTokenResponse;

    if (!response.ok || !tokenData.access_token) {
      const details = tokenData.error_description ?? tokenData.error;
      throw new Error(
        `Unable to refresh the Gmail access token${details ? `: ${details}` : '.'}`,
      );
    }

    const refreshBeforeExpiryMilliseconds = 60_000;
    const expiresInMilliseconds = (tokenData.expires_in ?? 3_600) * 1_000;

    this.cachedAccessToken = tokenData.access_token;
    this.cachedAccessTokenExpiresAt =
      Date.now() + expiresInMilliseconds - refreshBeforeExpiryMilliseconds;

    return this.cachedAccessToken;
  }

  private toSummary(message: GmailMessage): GmailMessageSummary {
    const subject =
      message.payload?.headers?.find(
        (header) => header.name.toLowerCase() === 'subject',
      )?.value ?? '';

    return {
      id: message.id,
      internalDate: Number(message.internalDate ?? 0),
      subject,
      snippet: message.snippet ?? '',
    };
  }

  private extractResetLink(message: GmailMessage): string | undefined {
    const body = this.collectBodyText(message.payload)
      .join('\n')
      .replaceAll('&amp;', '&');
    const linkMatch = body.match(
      /https?:\/\/dmoneyportal\.roadtocareer\.net\/reset-password\?token=[^\s"'<>]+/,
    );

    return linkMatch?.[0];
  }

  private collectBodyText(part?: GmailMessagePart): string[] {
    if (!part) {
      return [];
    }

    const currentBody = part.body?.data
      ? [this.decodeBase64Url(part.body.data)]
      : [];
    const nestedBodies = (part.parts ?? []).flatMap((nestedPart) =>
      this.collectBodyText(nestedPart),
    );

    return [...currentBody, ...nestedBodies];
  }

  private decodeBase64Url(value: string): string {
    const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
    return Buffer.from(base64, 'base64').toString('utf8');
  }

  private async wait(milliseconds: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}
