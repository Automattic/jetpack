export const VALID_SECTIONS = [ 'site', 'copy', 'images', 'additional' ];
export const API_PATH = '/wpcom/v2/jetpack-ai/suggest-guidelines';
// jetpack.com/redirect source handlers for the "Read more" support link —
// WordPress.com platform sites (Simple/Atomic) get the wordpress.com support
// page, self-hosted sites the jetpack.com one. Point them at the final
// support pages in the redirect tool once published — no code deploy needed.
export const GUIDELINES_SUPPORT_REDIRECT_WPCOM = 'wpcom-support-content-guidelines';
export const GUIDELINES_SUPPORT_REDIRECT_JETPACK = 'jetpack-support-content-guidelines';
