import { __, sprintf } from '@wordpress/i18n';

export const COOKIE_POLICY_URL = 'https://automattic.com/cookies/';

export const DEFAULT_TEXT = sprintf(
	// translators: %s is a link to the cookie policy.
	__(
		'Privacy & Cookies: This site uses cookies. By continuing to use this website, you agree to their use. To find out more, including how to control cookies, see here: %s.',
		'jetpack'
	),
	`<a href="${ COOKIE_POLICY_URL }">${ __( 'Cookie Policy', 'jetpack' ) }</a>`
);
