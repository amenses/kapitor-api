const crypto = require('crypto');
const { digilockerConfig, validateDigilocker } = require('../../config');
const { digilockerRepo } = require('../../repos');

class DigilockerService {
  /**
   * Generate authorization URL
   * @returns {Object} { url, state }
   */
  getAuthorizationUrl() {
    validateDigilocker();

    const state = crypto.randomBytes(12).toString('hex');
    const url = new URL(`${digilockerConfig.baseUrl}/oauth2/authorize`);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', digilockerConfig.clientId);
    url.searchParams.set('redirect_uri', digilockerConfig.redirectUri);
    url.searchParams.set('state', state);
    url.searchParams.set('scope', digilockerConfig.defaultScope);

    return {
      url: url.toString(),
      state,
    };
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code
   * @returns {Promise<Object>}
   */
  async exchangeCodeForToken(code) {
    validateDigilocker();

    const response = await fetch(`${digilockerConfig.baseUrl}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: digilockerConfig.clientId,
        client_secret: digilockerConfig.clientSecret,
        redirect_uri: digilockerConfig.redirectUri,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`DigiLocker token exchange failed: ${text}`);
    }

    return response.json();
  }

  /**
   * Store tokens for user
   * @param {string} uid
   * @param {Object} tokenData
   * @returns {Promise<Object>}
   */
  async storeTokens(uid, tokenData) {
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    const tokenRecord = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || null,
      tokenType: tokenData.token_type || 'Bearer',
      scope: tokenData.scope || null,
      expiresAt,
    };

    await digilockerRepo.upsert(uid, tokenRecord);

    return {
      status: 'linked',
      expiresAt,
      scope: tokenData.scope,
    };
  }

  /**
   * Get stored access token for user
   * @param {string} uid
   * @returns {Promise<string|null>}
   */
  async getAccessToken(uid) {
    const token = await digilockerRepo.findByUid(uid);
    if (!token || !token.accessToken) {
      return null;
    }

    // Check if token is expired
    if (token.expiresAt && new Date() > token.expiresAt) {
      // Token expired, could implement refresh logic here
      return null;
    }

    return token.accessToken;
  }

  /**
   * Fetch issued documents from DigiLocker
   * @param {string} accessToken
   * @returns {Promise<Array>}
   */
  async fetchDocuments(accessToken) {
    validateDigilocker();

    const response = await fetch(`${digilockerConfig.baseUrl}/v1/files/issued`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to fetch DigiLocker documents: ${text}`);
    }

    return response.json();
  }

  /**
   * Link DigiLocker account and store tokens
   * @param {string} uid
   * @param {string} code
   * @returns {Promise<Object>}
   */
  async linkAccount(uid, code) {
    const tokenData = await this.exchangeCodeForToken(code);
    return this.storeTokens(uid, tokenData);
  }

  /**
   * Get documents for user
   * @param {string} uid
   * @returns {Promise<Array>}
   */
  async getUserDocuments(uid) {
    const accessToken = await this.getAccessToken(uid);
    if (!accessToken) {
      throw new Error('DigiLocker not linked or token expired');
    }

    return this.fetchDocuments(accessToken);
  }
}

module.exports = new DigilockerService();

