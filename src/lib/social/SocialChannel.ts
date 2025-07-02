export enum SocialPlatform {
  Facebook = 'facebook',
  Instagram = 'instagram',
  Google = 'google',
  LinkedIn = 'linkedin',
  Dropbox = 'dropbox',
  TikTok = 'tiktok',
  X = 'x',
  Threads = 'threads',
  YouTube = 'youtube'
}

// Common types
export interface PostContent {
  text: string
  mediaUrl?: string
  scheduledAt?: Date
}

export interface PostResult {
  success: boolean
  postId?: string
  error?: string
}

export interface Notification {
  id: string
  message: string
  createdAt: Date
}

// Base abstract class
export abstract class SocialChannel {
  abstract readonly providerName: SocialPlatform
  abstract readonly url: string

  constructor(protected token: string) {
    this.token = token
  }

  // OAuth
  abstract getAuthUrl(): Promise<SocialChannel>
  //   abstract exchangeCode(code: string): Promise<string>
  abstract refreshToken?(refreshToken: string): Promise<string>

  // Posting
  //   abstract post(content: PostContent): Promise<PostResult>
  //   abstract getPosts(options?: { limit?: number; offset?: number }): Promise<PostContent[]>
  //   abstract getPostById(postId: string): Promise<PostContent | null>
  //   abstract schedulePost(content: PostContent): Promise<void>
  //   abstract updatePost(postId: string, content: PostContent): Promise<PostResult>
  //   abstract getScheduledPosts(): Promise<PostContent[]>

  //   // Notifications
  //   abstract getNotifications(): Promise<Notification[]>
}
