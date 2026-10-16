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
