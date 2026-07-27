import { __, sprintf } from '@wordpress/i18n';

export type ShareService =
	| 'mail'
	| 'tumblr'
	| 'bluesky'
	| 'linkedin'
	| 'telegram'
	| 'reddit'
	| 'whatsapp'
	| 'x';

export type ShareLink = {
	/** `social-logos` icon name, which doubles as the Tracks event type. */
	service: ShareService;
	/** Visible button text. */
	label: string;
	/** Accessible name, since the label alone reads as a bare noun. */
	title: string;
	href: string;
};

/**
 * WhatsApp's `api.` host mishandles the share URL on Firefox for desktop, which
 * sends people to a broken page. Jetpack's own sharing buttons work around it
 * the same way — see `Share_WhatsApp::process_request()` in
 * `modules/sharedaddy/sharing-sources.php`, which switches host on
 * `User_Agent_Info::is_firefox_desktop()`. This is that check, client side.
 *
 * @return The WhatsApp host to send this visitor to.
 */
function getWhatsAppHost(): string {
	const agent = typeof navigator === 'undefined' ? '' : navigator.userAgent;
	const isFirefoxDesktop = /Firefox\//.test( agent ) && ! /Mobile|Tablet/.test( agent );

	return isFirefoxDesktop ? 'web.whatsapp.com' : 'api.whatsapp.com';
}

/**
 * Every share destination, in display order.
 *
 * Ported from Calypso's `packages/launchpad/src/action-components/share-site-modal`,
 * with three deliberate differences: the WhatsApp host is chosen per
 * {@link getWhatsAppHost}, and Tumblr and Reddit are requested over https rather
 * than http.
 *
 * @param url  - The newsletter URL being shared.
 * @param text - Accompanying message, for the services that carry one.
 * @return The share links.
 */
export function getShareLinks( url: string, text: string ): ShareLink[] {
	const encodedUrl = encodeURIComponent( url );
	const encodedText = encodeURIComponent( text );

	return [
		{
			service: 'mail',
			label: __( 'Email', 'jetpack-newsletter' ),
			title: __( 'Share via email', 'jetpack-newsletter' ),
			href: `mailto:?subject=${ encodedText }&body=${ encodedUrl }`,
		},
		{
			service: 'tumblr',
			label: __( 'Tumblr', 'jetpack-newsletter' ),
			title: __( 'Share on Tumblr', 'jetpack-newsletter' ),
			href: `https://www.tumblr.com/share/link?url=${ encodedUrl }`,
		},
		{
			service: 'bluesky',
			label: __( 'Bluesky', 'jetpack-newsletter' ),
			title: __( 'Share on Bluesky', 'jetpack-newsletter' ),
			href: `https://bsky.app/intent/compose?text=${ encodedUrl }`,
		},
		{
			service: 'linkedin',
			label: __( 'LinkedIn', 'jetpack-newsletter' ),
			title: __( 'Share on LinkedIn', 'jetpack-newsletter' ),
			href: `https://www.linkedin.com/shareArticle?mini=true&url=${ encodedUrl }&title=${ encodedText }`,
		},
		{
			service: 'telegram',
			label: __( 'Telegram', 'jetpack-newsletter' ),
			title: __( 'Share on Telegram', 'jetpack-newsletter' ),
			href: `https://t.me/share/url?url=${ encodedUrl }&text=${ encodedText }`,
		},
		{
			service: 'reddit',
			label: __( 'Reddit', 'jetpack-newsletter' ),
			title: __( 'Share on Reddit', 'jetpack-newsletter' ),
			href: `https://www.reddit.com/submit?url=${ encodedUrl }&title=${ encodedText }`,
		},
		{
			service: 'whatsapp',
			label: __( 'WhatsApp', 'jetpack-newsletter' ),
			title: __( 'Share on WhatsApp', 'jetpack-newsletter' ),
			href: `https://${ getWhatsAppHost() }/send?text=${ encodedUrl }`,
		},
		{
			service: 'x',
			label: __( 'X', 'jetpack-newsletter' ),
			title: __( 'Share on X', 'jetpack-newsletter' ),
			href: `https://x.com/intent/post?url=${ encodedUrl }&text=${ encodedText }`,
		},
	];
}

/**
 * The message that rides along with the URL on services that accept one.
 *
 * @param url - The newsletter URL being shared.
 * @return The share message.
 */
export function getShareText( url: string ): string {
	return sprintf(
		/* translators: %s: the newsletter's URL. */
		__( 'Please visit my newsletter: %s', 'jetpack-newsletter' ),
		url
	);
}
