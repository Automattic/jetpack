import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { accessOptions } from './constants';

/**
 * Apply HTML encoding for special characters inside shortcode attributes.
 *
 * @see https://codex.wordpress.org/Shortcode_API#Attributes
 * @param {string} value - Value to encode.
 * @return {string} Encoded value.
 */
export const encodeValueForShortcodeAttribute = value => {
	return value
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' )
		.replace( /"/g, '&quot;' )
		.replace( /'/g, '&#039;' )
		.replace( /\[/g, '&#091;' )
		.replace( /\]/g, '&#093;' )
		.replace( /\u00a0/g, '&nbsp;' )
		.replace( /\u200b/g, '&#x200b;' );
};

export const getPaidPlanLink = alreadyHasTierPlans => {
	// Self-hosted Jetpack sites manage payments from Jetpack Cloud, which serves the
	// same screens under /monetize rather than /earn.
	const base = isWpcomPlatformSite()
		? 'https://wordpress.com/earn/payments/'
		: 'https://cloud.jetpack.com/monetize/payments/';
	const link = base + location.hostname;
	// We force the "Newsletters plan" link only if there is no plans already created
	return alreadyHasTierPlans ? link : link + '#add-tier-plan';
};

/**
 * Whether "Paid subscribers" can be chosen, and whether to show it disabled.
 * Shared by the Content access panel and the paywall block toolbar so they never disagree.
 *
 * @param {object}      props                  - Props.
 * @param {string|null} props.stripeConnectUrl - Stripe connect URL, null once connected.
 * @param {boolean}     props.hasTierPlans     - Whether a newsletter tier exists.
 * @param {string}      [props.accessLevel]    - The post's saved access level; omit to get only isPaidAvailable.
 * @param {boolean}     [props.isLoading]      - Whether the memberships status is still loading.
 * @return {{isPaidAvailable: boolean, showPaidAsDisabled: boolean, showSetupPrompt: boolean}} Paid option state.
 */
export const getPaidAccessState = ( {
	stripeConnectUrl,
	hasTierPlans,
	accessLevel,
	isLoading = false,
} ) => {
	const isPaidAvailable = stripeConnectUrl === null && hasTierPlans;
	// Keep the option selectable when it is already the saved value, so a post set to
	// paid before Stripe was disconnected does not end up with nothing selected.
	const showPaidAsDisabled =
		! isPaidAvailable && accessLevel !== accessOptions.paid_subscribers.key;
	// While the status is still loading the option stays disabled, but "not known yet" must
	// not be presented as "not set up", so the setup prompt waits for the status.
	const showSetupPrompt = showPaidAsDisabled && ! isLoading;
	return { isPaidAvailable, showPaidAsDisabled, showSetupPrompt };
};

export const getShowMisconfigurationWarning = ( postVisibility, accessLevel ) => {
	return postVisibility === 'private' && accessLevel !== accessOptions.everybody.key;
};

export const MisconfigurationWarning = () => (
	<Notice
		status="warning"
		isDismissible={ false }
		className="edit-post-post-misconfiguration__warning"
	>
		{ __(
			'Subscribers aren’t able to view private posts. To let them read it, change its visibility to Public or Password protected.',
			'jetpack'
		) }
	</Notice>
);
