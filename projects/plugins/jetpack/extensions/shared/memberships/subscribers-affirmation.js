import { Animate } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { createInterpolateElement } from '@wordpress/element';
import { sprintf, __, _n } from '@wordpress/i18n';
import paywallBlockMetadata from '../../blocks/paywall/block.json';
import {
	accessOptions,
	META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS,
} from '../../shared/memberships/constants';
import { getReachForAccessLevelKey } from '../../shared/memberships/settings';
import { store as membershipProductsStore } from '../../store/membership-products';

/**
 * Get the formatted list of categories for a post.
 * @param {Array} postCategories - list of category IDs for the post
 * @param {Array} newsletterCategories - list of the site's newsletter categories
 * @returns {string} - formatted list of categories
 */
const getFormattedCategories = ( postCategories, newsletterCategories ) => {
	// If the post has no categories, then it's going to have the 'Uncategorized' category
	const updatedPostCategories = postCategories.length ? postCategories : [ 1 ];

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

const getCopyForCategorySubscribers = ( {
	futureTense,
	newsletterCategories,
	postCategories,
	reachCount,
} ) => {
	const formattedCategoryNames = getFormattedCategories( postCategories, newsletterCategories );
	const reachCountString = reachCount.toLocaleString();

	if ( futureTense ) {
		return sprintf(
			// translators: %1s is the list of categories, %2d is subscriptions count
			_n(
				'This post will be sent to everyone subscribed to %1$s (%2$s subscriber).',
				'This post will be sent to everyone subscribed to %1$s (%2$s subscribers).',
				reachCount,
				'jetpack'
			),
			formattedCategoryNames,
			reachCountString
		);
	}

	return sprintf(
		// translators: %1s is the list of categories, %2d is subscriptions count
		_n(
			'This post was sent to everyone subscribed to %1$s (%2$s subscriber).',
			'This post was sent to everyone subscribed to %1$s (%2$s subscribers).',
			reachCount,
			'jetpack'
		),
		formattedCategoryNames,
		reachCountString
	);
};

// Determines copy to show in post-publish panel to confirm number and type of subscribers who received the post as email, or will receive in case of scheduled post.
export const getCopyForSubscribers = ( {
	futureTense,
	isPaidPost,
	postHasPaywallBlock,
	reachCount,
} ) => {
	const reachCountString = reachCount.toLocaleString();

	// Schedulled post
	if ( futureTense ) {
		// Paid post without paywall: sent only to paid subscribers
		if ( isPaidPost && ! postHasPaywallBlock ) {
			return sprintf(
				/* translators: %s is the number of subscribers */
				_n(
					'This post will be sent to <strong>%s paid subscriber</strong>.',
					'This post will be sent to <strong>%s paid subscribers</strong>.',
					reachCount,
					'jetpack'
				),
				reachCountString
			);
		}
		// Paid post with paywall or Free post, sent to all subscribers
		return sprintf(
			/* translators: %s is the number of subscribers */
			_n(
				'This post will be sent to <strong>%s subscriber</strong>.',
				'This post will be sent to <strong>%s subscribers</strong>.',
				reachCount,
				'jetpack'
			),
			reachCountString
		);
	}
	// Paid post without paywall: sent only to paid subscribers
	if ( isPaidPost && ! postHasPaywallBlock ) {
		return sprintf(
			/* translators: %s is the number of subscribers */
			_n(
				'This post was sent to <strong>%s paid subscriber</strong>.',
				'This post was sent to <strong>%s paid subscribers</strong>.',
				reachCount,
				'jetpack'
			),
			reachCountString
		);
	}
	// Paid post sent only to paid subscribers, post is already published
	if ( isPaidPost && ! postHasPaywallBlock ) {
		return sprintf(
			/* translators: %s is the number of subscribers */
			_n(
				'This post was sent to <strong>%s paid subscriber</strong> only.',
				'This post was sent to <strong>%s paid subscribers</strong> only.',
				reachCount,
				'jetpack'
			),
			reachCountString
		);
	}

	// Paid post with paywall or Free post, sent to all subscribers, post is already published
	return sprintf(
		/* translators: %s is the number of subscribers */
		_n(
			'This post was sent to <strong>%s subscriber</strong>.',
			'This post was sent to <strong>%s subscribers</strong>.',
			reachCount,
			'jetpack'
		),
		reachCountString
	);
};

/*
 * Determines copy to show in pre/post-publish panels to confirm number and type of subscribers receiving the post as email.
 */
function SubscribersAffirmation( { accessLevel, prePublish = false } ) {
	const postHasPaywallBlock = useSelect( select =>
		select( 'core/block-editor' )
			.getBlocks()
			.some( block => block.name === paywallBlockMetadata.name )
	);

	const { isScheduledPost, postCategories, postMeta } = useSelect( select => {
		const { isCurrentPostScheduled, getEditedPostAttribute } = select( editorStore );
		return {
			isScheduledPost: isCurrentPostScheduled(),
			postCategories: getEditedPostAttribute( 'categories' ),
			postMeta: getEditedPostAttribute( 'meta' ),
		};
	} );

	const isSendEmailEnabled = () => {
		// Meta value is negated, "don't send", but toggle is truthy when enabled "send"
		return ! postMeta?.[ META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS ];
	};

	const {
		emailSubscribersCount,
		hasFinishedLoading,
		newsletterCategories,
		newsletterCategoriesEnabled,
		newsletterCategorySubscriberCount,
		paidSubscribersCount,
	} = useSelect( select => {
		const {
			getNewsletterCategories,
			getNewsletterCategoriesEnabled,
			getNewsletterCategoriesSubscriptionsCount,
			getSubscriberCounts,
			hasFinishedResolution,
		} = select( membershipProductsStore );

		// Free and paid subscriber counts
		const { emailSubscribers, paidSubscribers } = getSubscriberCounts();

		return {
			hasFinishedLoading: [
				// getNewsletterCategoriesEnabled state is set by getNewsletterCategories so no need to check for it here.
				hasFinishedResolution( 'getSubscriberCounts' ),
				hasFinishedResolution( 'getNewsletterCategories' ),
				hasFinishedResolution( 'getNewsletterCategoriesSubscriptionsCount' ),
			].every( Boolean ),
			emailSubscribersCount: emailSubscribers,
			newsletterCategories: getNewsletterCategories(),
			newsletterCategoriesEnabled: getNewsletterCategoriesEnabled(),
			newsletterCategorySubscriberCount: getNewsletterCategoriesSubscriptionsCount(),
			paidSubscribersCount: paidSubscribers,
		};
	} );

	if ( ! hasFinishedLoading ) {
		return (
			<Animate type="loading">
				{ ( { className } ) => (
					<p className={ `jetpack-subscribe-affirmation-loading ${ className }` }>
						{ __( 'Loading…', 'jetpack' ) }
					</p>
				) }
			</Animate>
		);
	}

	const isPaidPost = accessLevel === accessOptions.paid_subscribers.key;

	// Show all copy in future tense
	const futureTense = prePublish || isScheduledPost;

	const reachForAccessLevel = getReachForAccessLevelKey( {
		accessLevel,
		emailSubscribers: emailSubscribersCount,
		paidSubscribers: paidSubscribersCount,
		postHasPaywallBlock,
	} );

	let text;

	if ( ! isSendEmailEnabled() ) {
		text = __( 'Not sent via email.', 'jetpack' );
	} else if ( newsletterCategoriesEnabled && newsletterCategories.length > 0 && ! isPaidPost ) {
		// Get newsletter category copy & count separately, unless post is paid
		text = getCopyForCategorySubscribers( {
			futureTense,
			isPaidPost,
			newsletterCategories,
			postCategories,
			reachCount: newsletterCategorySubscriberCount,
		} );
	} else {
		text = getCopyForSubscribers( {
			futureTense,
			isPaidPost,
			postHasPaywallBlock,
			reachCount: reachForAccessLevel,
		} );
	}

	return (
		<p>
			{ createInterpolateElement( text, {
				strong: <strong />,
			} ) }
		</p>
	);
}

export default SubscribersAffirmation;
