import { __ } from '@wordpress/i18n';

// The at-limit copy is shared with the Library's disabled-upload tooltip and
// its at-limit drop notice, so every surface describes the cap identically.
export const FREE_TIER_AT_LIMIT_MESSAGE = __(
	'You’ve reached the free plan’s 1-video limit. Upgrade to upload more.',
	'jetpack-videopress-pkg'
);

// Stable id for the at-limit toast, so a user who keeps dropping files at the
// limit refreshes one notice instead of stacking a column of identical black
// bars: the notices store drops an existing notice with the same id on create.
// Shared across surfaces on purpose — the plan is one fact, and only one of
// these surfaces is on screen at a time.
export const FREE_TIER_AT_LIMIT_NOTICE_ID = 'vp-upload-at-limit';
