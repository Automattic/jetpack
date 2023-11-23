import { Button, ToolbarButton, Notice } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { _x, __, sprintf } from '@wordpress/i18n';
import { accessOptions } from './constants';

/**
 * Apply HTML encoding for special characters inside shortcode attributes.
 *
 * @see https://codex.wordpress.org/Shortcode_API#Attributes
 * @param {string} value - Value to encode.
 * @returns {string} Encoded value.
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
	const link = 'https://wordpress.com/earn/payments-plans/' + location.hostname;
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

export default function GetAddPaidPlanButton( { context = 'other', hasTierPlans } ) {
	const addPaidPlanButtonText = hasTierPlans
		? _x( 'Manage plans', 'unused context to distinguish translations', 'jetpack' )
		: __( 'Set up a paid plan', 'jetpack' );

	if ( 'toolbar' === context ) {
		return (
			<ToolbarButton href={ getPaidPlanLink( hasTierPlans ) } target="_blank">
				{ addPaidPlanButtonText }
			</ToolbarButton>
		);
	}

	return (
		<Button variant="primary" href={ getPaidPlanLink( hasTierPlans ) } target="_blank">
			{ addPaidPlanButtonText }
		</Button>
	);
}

const UNCATEGORIZED_CATEGORY_ID = 1;

/**
 * Get the formatted list of categories for a post.
 * @param {Array} postCategories - list of category IDs for the post
 * @param {Array} newsletterCategories - list of the site's newsletter categories
 * @returns {string} - formatted list of categories
 */
export const getFormattedCategories = ( postCategories, newsletterCategories ) => {
	// If the post has no categories, then it's going to have the 'Uncategorized' category
	const updatedPostCategories = postCategories.length
		? postCategories
		: [ UNCATEGORIZED_CATEGORY_ID ];

	// If the post has a non newsletter category, then it's going to be sent to 'All content' subscribers
	const hasNonNewsletterCategory = updatedPostCategories.some( postCategory => {
		return ! newsletterCategories.some( newsletterCategory => {
			return newsletterCategory.id === postCategory;
		} );
	} );

	// Get the newsletter category names for the post
	const categoryNames = newsletterCategories
		.filter( category => updatedPostCategories.includes( category.id ) )
		.map( category => category.name );

	if ( hasNonNewsletterCategory ) {
		categoryNames.push( __( 'All content', 'jetpack' ) );
	}

	const formattedCategoriesArray = categoryNames.map(
		categoryName => `<strong>${ categoryName }</strong>`
	);
	let formattedCategories = '';

	if ( formattedCategoriesArray.length === 1 ) {
		formattedCategories = formattedCategoriesArray[ 0 ];
	} else if ( formattedCategoriesArray.length === 2 ) {
		// translators: %1$s: first category name, %2$s: second category name
		formattedCategories = sprintf( __( '%1$s and %2$s', 'jetpack' ), ...formattedCategoriesArray );
	} else {
		const allButLast = formattedCategoriesArray.slice( 0, -1 ).join( `${ __( ',', 'jetpack' ) } ` );
		const last = formattedCategoriesArray[ formattedCategoriesArray.length - 1 ];

		formattedCategories = sprintf(
			// translators: %1$s: a comma-separated list of category names except for the last one, %2$s: the name of the last category
			__( '%1$s, and %2$s', 'jetpack' ),
			allButLast,
			last
		);
	}

	return formattedCategories;
};
