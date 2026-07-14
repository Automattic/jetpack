import { Notice } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
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
	const link = 'https://wordpress.com/earn/payments/' + location.hostname;
	// We force the "Newsletters plan" link only if there is no plans already created
	return alreadyHasTierPlans ? link : link + '#add-tier-plan';
};

export const getShowMisconfigurationWarning = ( postVisibility, accessLevel ) => {
	return postVisibility !== 'public' && accessLevel !== accessOptions.everybody.key;
};

export const MisconfigurationWarning = () => (
	<Notice
		status="warning"
		isDismissible={ false }
		className="edit-post-post-misconfiguration__warning"
	>
		{ createInterpolateElement(
			__(
				'You’ll need to change the post’s access to Everybody or visibility to Public.<br/>' +
					'<br/>' +
					'Subscribers aren’t able to view private or password-protected posts.',
				'jetpack'
			),
			{ br: <br /> }
		) }
	</Notice>
);
