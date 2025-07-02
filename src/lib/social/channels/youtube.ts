import { SocialChannel, PostContent, PostResult, Notification, SocialPlatform } from '../SocialChannel'

export class YoutubeChannel extends SocialChannel {
  readonly providerName = SocialPlatform.Facebook
  readonly url = 'https://www.googleapis.com'

  async getAuthUrl() {
    const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    oauthUrl.searchParams.set('client_id', '{CLIENT_ID}') // Replace with your client ID
    oauthUrl.searchParams.set('redirect_uri', '{REDIRECT_URI}') // Replace with your redirect URI
    oauthUrl.searchParams.set('response_type', 'code')
    oauthUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/youtube.readonly')
    oauthUrl.searchParams.set('access_type', 'offline')
    oauthUrl.searchParams.set('prompt', 'consent')
    const response = await fetch(oauthUrl.toString()).then(res => res.json())

    console.debug('Youtube OAuth URL:', response)

    const codeUrl = new URL('https://oauth2.googleapis.com/token')
    codeUrl.searchParams.set('client_id', '{CLIENT_ID}') // Replace with your client ID
    codeUrl.searchParams.set('client_secret', '{CLIENT_SECRET}') // Replace with your client secret
    codeUrl.searchParams.set('redirect_uri', '{REDIRECT_URI}') // Replace with your redirect URI
    codeUrl.searchParams.set('grant_type', 'authorization_code')
    codeUrl.searchParams.set('code', response.code) // Replace with the authorization code received from Google

    const codeResponse = await fetch(codeUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to exchange code: ${res.statusText}`)
        }
        return res.json()
      })
      .then(data => {
        console.debug('Youtube OAuth Token:', data)
        return data.access_token
      })

    console.debug('Youtube OAuth Code URL:', codeResponse)

    return new YoutubeChannel(response.access_token)
  }

  async refreshToken(refreshToken: string): Promise<string> {
    const refreshUrl = new URL('https://oauth2.googleapis.com/token')
    refreshUrl.searchParams.set('client_id', '{CLIENT_ID}') // Replace with your client ID
    refreshUrl.searchParams.set('client_secret', '{CLIENT_SECRET}') // Replace with your client secret
    refreshUrl.searchParams.set('refresh_token', refreshToken) // Replace with the refresh token
    refreshUrl.searchParams.set('grant_type', 'refresh_token') // Set the grant type to refresh_token

    const response = await fetch(refreshUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`)
    }

    const data = await response.json()
    console.debug('Youtube Refresh Token Response:', data)

    return data.access_token
  }
}
