import {MessageAttachment} from '@slack/types'
export interface PullRequest {
    url: string
    id: number
    number: number
    head: {
      ref: string
      sha: string
      repo: {
        id: number
        url: string
        name: string
      }
    }
    base: {
      ref: string
      sha: string
      repo: {
        id: number
        url: string
        name: string
      }
    }
  }
  
  export type IncludeJobs = 'true' | 'false' | 'on-failure'
  export type SlackMessageAttachmentFields = MessageAttachment['fields']