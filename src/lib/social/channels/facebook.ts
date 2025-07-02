import { SocialChannel, PostContent, PostResult, Notification, SocialPlatform } from '../SocialChannel'

export class FacebookChannel extends SocialChannel {
  readonly providerName = SocialPlatform.Facebook
  readonly url = 'https://www.facebook.com'

  getAuthUrl(): string {
    // Return Facebook OAuth URL with your client ID, scopes, and redirect URI
    return this.url
  }
}
