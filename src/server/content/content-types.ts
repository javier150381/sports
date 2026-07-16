export const WEB_EMBED_MARKER = '__KUNTUR_WEB_EMBED__'
export const HISTORIC_MOMENT_MARKER = '__KUNTUR_HISTORIC_MOMENT__'
export const TEAM_CHANT_MARKER = '__KUNTUR_TEAM_CHANT__'

export function normalizeContentPostType<
  T extends { alt_text: string | null; content_type: string },
>(post: T): T {
  if (
    post.content_type === 'ANNOUNCEMENT' &&
    post.alt_text === WEB_EMBED_MARKER
  ) {
    return {
      ...post,
      alt_text: null,
      content_type: 'WEB_EMBED',
    }
  }

  if (
    post.content_type === 'VIDEO' &&
    post.alt_text === HISTORIC_MOMENT_MARKER
  ) {
    return {
      ...post,
      alt_text: null,
      content_type: 'HISTORIC_MOMENT',
    }
  }

  if (post.content_type === 'VIDEO' && post.alt_text === TEAM_CHANT_MARKER) {
    return {
      ...post,
      alt_text: null,
      content_type: 'TEAM_CHANT',
    }
  }

  return post
}
