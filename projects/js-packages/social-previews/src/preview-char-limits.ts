import { BODY_CHAR_LIMIT as BLUESKY_BODY_CHAR_LIMIT } from './bluesky-preview/helpers';
import { CUSTOM_TEXT_LENGTH as FACEBOOK_BODY_CHAR_LIMIT } from './facebook-preview/helpers';
import { FEED_TEXT_MAX_LENGTH as INSTAGRAM_BODY_CHAR_LIMIT } from './instagram-preview/constants';
import { FEED_TEXT_MAX_LENGTH as LINKEDIN_BODY_CHAR_LIMIT } from './linkedin-preview/constants';
import { BODY_CHAR_LIMIT as MASTODON_BODY_CHAR_LIMIT } from './mastodon-preview/helpers';
import { FEED_TEXT_MAX_LENGTH as NEXTDOOR_BODY_CHAR_LIMIT } from './nextdoor-preview/constants';
import { CAPTION_MAX_CHARS as THREADS_BODY_CHAR_LIMIT } from './threads-preview/helpers';
import { BODY_CHAR_LIMIT as TUMBLR_BODY_CHAR_LIMIT } from './tumblr-preview/helpers';

/**
 * Per-network character cap for the visible body text the preview components
 * render. Keyed by the connection service slug used by Publicize. Networks
 * without a preview-side body cap (e.g. `x`) are intentionally omitted.
 */
export const PREVIEW_BODY_CHAR_LIMITS: Readonly< Record< string, number > > = {
	bluesky: BLUESKY_BODY_CHAR_LIMIT,
	facebook: FACEBOOK_BODY_CHAR_LIMIT,
	'instagram-business': INSTAGRAM_BODY_CHAR_LIMIT,
	linkedin: LINKEDIN_BODY_CHAR_LIMIT,
	mastodon: MASTODON_BODY_CHAR_LIMIT,
	nextdoor: NEXTDOOR_BODY_CHAR_LIMIT,
	threads: THREADS_BODY_CHAR_LIMIT,
	tumblr: TUMBLR_BODY_CHAR_LIMIT,
};
