import { __, sprintf } from '@wordpress/i18n';
import { accessOptions } from './constants';

// Who can read a post and who gets it by email, in words shared by the Newsletter
// overview and the Audience settings. Kept free of React and stores so it tests as plain logic.

type AccessLevelKey = keyof typeof accessOptions;

/**
 * Describe who can read the post on the site. Who receives it by email is described
 * by the Newsletter overview, which also knows about the email toggle and categories.
 *
 * @param {string}      accessLevel         - Access level key, e.g. 'paid_subscribers'.
 * @param {boolean}     postHasPaywallBlock - Whether the post contains a paywall block.
 * @param {string|null} tierName            - Paid tier the post is limited to, if any.
 * @return {string} Description of the current access level.
 */
export function getAccessDescription(
	accessLevel: string,
	postHasPaywallBlock = false,
	tierName: string | null = null
): string {
	const isRestricted =
		accessLevel === accessOptions.subscribers.key ||
		accessLevel === accessOptions.paid_subscribers.key;

	if ( ! isRestricted ) {
		return __( 'Anyone can read it on your site.', 'jetpack' );
	}

	if ( accessLevel === accessOptions.paid_subscribers.key && tierName && ! postHasPaywallBlock ) {
		return sprintf(
			/* translators: %s: paid newsletter tier name, e.g. "Plus". */
			__( 'Only subscribers on your ‘%s’ tier can read it on your site.', 'jetpack' ),
			tierName
		);
	}

	// Keyed rather than ternaries: the minifier merges `c ? __( a ) : __( b )` into a non-literal msgid.
	const descriptions = {
		subscribers: __(
			'Only subscribers can read it on your site. Others see a preview and can subscribe.',
			'jetpack'
		),
		paid_subscribers: __(
			'Only paid subscribers can read it on your site. Others see a preview and can subscribe or upgrade.',
			'jetpack'
		),
		subscribers_paywall: __(
			'Anyone can read it up to your paywall. Only subscribers can read the rest.',
			'jetpack'
		),
		paid_subscribers_paywall: __(
			'Anyone can read it up to your paywall. Only paid subscribers can read the rest.',
			'jetpack'
		),
	};

	return descriptions[ postHasPaywallBlock ? `${ accessLevel }_paywall` : accessLevel ];
}

export interface OverviewText {
	main: string;
	details: string[];
	categoryNames?: string[];
	isEmailOff?: boolean;
}

export interface OverviewTextArgs {
	accessLevel?: string;
	isEmailEnabled: boolean;
	isPasswordProtected: boolean;
	hasPaywall: boolean;
	tierName: string | null;
	categoryNames: string[];
}

const getAccessLevelKey = ( accessLevel?: string ): AccessLevelKey =>
	accessLevel && accessLevel in accessOptions ? ( accessLevel as AccessLevelKey ) : 'everybody';

/**
 * Describe who receives the post by email and who can read it on the site.
 *
 * @param {OverviewTextArgs} args - Post settings that decide the newsletterOverview.
 * @return {OverviewText} The copy to render.
 */
export function getNewsletterOverviewText( args: OverviewTextArgs ): OverviewText {
	const level = getAccessLevelKey( args.accessLevel );

	if ( ! args.isEmailEnabled ) {
		return {
			main: __( 'This post won’t be emailed.', 'jetpack' ),
			details: [ getAccessDescription( level, args.hasPaywall, args.tierName ) ],
			isEmailOff: true,
		};
	}

	return getEmailedAudienceText( args );
}

/**
 * Describe who receives the post by email, for a post that will be emailed.
 *
 * @param {OverviewTextArgs} args - Post settings that decide the text.
 * @return {OverviewText} The text to render.
 */
function getEmailedAudienceText( {
	accessLevel,
	isPasswordProtected,
	hasPaywall,
	tierName,
	categoryNames,
}: OverviewTextArgs ): OverviewText {
	const level = getAccessLevelKey( accessLevel );
	// A paywall sends the part above it to every subscriber, even on a paid post.
	const isPaid = level === 'paid_subscribers' && ! hasPaywall;
	const audience = isPaid ? 'paid' : 'all';

	// Same sentence the Audience settings show, so both views describe site access alike.
	// Password protection changes what the email contains, not who receives it.
	const readAccess = isPasswordProtected
		? __(
				'The post stays password protected on your site. Only people with the password can read it there.',
				'jetpack'
			)
		: getAccessDescription( level, hasPaywall, tierName );

	if ( categoryNames.length ) {
		const toCategories = {
			all: __(
				'This post is emailed to subscribers who chose these newsletter categories.',
				'jetpack'
			),
			paid: __(
				'This post is emailed to paid subscribers who chose these newsletter categories.',
				'jetpack'
			),
		};
		const plusAllContent = {
			all: __( 'Plus subscribers who chose ‘All content’.', 'jetpack' ),
			paid: __( 'Plus paid subscribers who chose ‘All content’.', 'jetpack' ),
		};

		return {
			main:
				isPaid && tierName
					? sprintf(
							/* translators: %s: paid newsletter tier name, e.g. "VIP". */
							__(
								'This post is emailed to subscribers on your ‘%s’ tier who chose these newsletter categories.',
								'jetpack'
							),
							tierName
						)
					: toCategories[ audience ],
			categoryNames,
			details: [
				isPaid && tierName
					? sprintf(
							/* translators: %s: paid newsletter tier name, e.g. "VIP". */
							__( 'Plus subscribers on your ‘%s’ tier who chose ‘All content’.', 'jetpack' ),
							tierName
						)
					: plusAllContent[ audience ],
				readAccess,
			],
		};
	}

	if ( isPaid && tierName ) {
		return {
			main: sprintf(
				/* translators: %s: paid newsletter tier name, e.g. "Plus". */
				__( 'Only subscribers on your ‘%s’ tier are emailed this post.', 'jetpack' ),
				tierName
			),
			details: [ readAccess ],
		};
	}

	// Keyed rather than ternaries: the minifier merges `c ? __( a ) : __( b )` into a non-literal msgid.
	const emailedTo = {
		everybody: __( 'This post is emailed to all subscribers.', 'jetpack' ),
		subscribers: __( 'This post is emailed to all subscribers.', 'jetpack' ),
		paid_subscribers: __( 'Only your paid subscribers are emailed this post.', 'jetpack' ),
		// Readers who can't see past the paywall get the email cut off there, with an upgrade prompt.
		paid_subscribers_paywall: __(
			'This post is emailed to all subscribers. Free subscribers get it up to your paywall.',
			'jetpack'
		),
	};
	const emailKey = level === 'paid_subscribers' && hasPaywall ? 'paid_subscribers_paywall' : level;

	return { main: emailedTo[ emailKey ], details: [ readAccess ] };
}
