import { getAdminUrl } from '@automattic/jetpack-script-data';
import { isComingSoon } from '@automattic/jetpack-shared-extension-utils';
import { Animate } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { createInterpolateElement, useRef, useEffect } from '@wordpress/element';
import { sprintf, __, _n } from '@wordpress/i18n';
import paywallBlockMetadata from '../../blocks/paywall/block.json';
import {
	accessOptions,
	META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS,
} from '../../shared/memberships/constants';
import { getReachForAccessLevelKey } from '../../shared/memberships/settings';
import { store as membershipProductsStore } from '../../store/membership-products';
import {
	setPublishedWithEmailEnabledInSession,
	setRepublishedAlreadySentPostInSession,
} from '../../store/membership-products/actions';

/**
 * Get the formatted list of categories for a post.
 * @param {Array} postCategories       - list of category IDs for the post
 * @param {Array} newsletterCategories - list of the site's newsletter categories
 * @return {string} - formatted list of categories
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
	// This needs a more elegant solution, but for now it stops the crash when the count is undefined.
	const reachCountString = undefined === reachCount ? '0' : reachCount.toLocaleString();

	if ( futureTense ) {
		return sprintf(
			// translators: %1s is the list of categories, %2d is subscriptions count
			_n(
				'This post will be sent to everyone subscribed to %1$s (%2$s subscriber).',
				'This post will be sent to everyone subscribed to %1$s (%2$s subscribers).',
				reachCount ?? 0,
				'jetpack'
			),
			formattedCategoryNames,
			reachCountString
		);
	}

	return sprintf(
		// translators: %1s is the list of categories, %2d is subscriptions count
		_n(
			'This post was sent to everyone subscribed to %1$s (<link>%2$s subscriber</link>).',
			'This post was sent to everyone subscribed to %1$s (<link>%2$s subscribers</link>).',
			reachCount ?? 0,
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
				'This post was sent to <link>%s paid subscriber</link>.',
				'This post was sent to <link>%s paid subscribers</link>.',
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
			'This post was sent to <link>%s subscriber</link>.',
			'This post was sent to <link>%s subscribers</link>.',
			reachCount,
			'jetpack'
		),
		reachCountString
	);
};

const SENDING_IN_PROGRESS_WINDOW_MS = 15 * 60 * 1000;

/**
 * Format sent date from Unix timestamp or MySQL timestamp string.
 *
 * @param {number|null} emailSentAt    - Unix timestamp from email_notification meta
 * @param {string|null} statsTimestamp - MySQL timestamp from stats_on_send
 * @return {string} Formatted date string
 */
function formatSentDate( emailSentAt, statsTimestamp ) {
	let date = null;
	if ( emailSentAt ) {
		date = new Date( emailSentAt * 1000 );
	} else if ( statsTimestamp ) {
		date = new Date( statsTimestamp );
	}
	if ( ! date || isNaN( date.getTime() ) ) {
		return '';
	}
	return date.toLocaleDateString( undefined, {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	} );
}

/**
 * Get category names from stats post_categories (term IDs) using newsletter categories list.
 *
 * @param {Array} postCategories       - Term IDs from stats_on_send
 * @param {Array} newsletterCategories - Site newsletter categories with id, name
 * @return {string} Formatted category list (e.g. "Category A and Category B" or "All content")
 */
function getCategoryNamesFromStats( postCategories, newsletterCategories ) {
	if ( ! postCategories?.length ) {
		return '';
	}
	const categoryNames = postCategories
		.map( termId => {
			const cat = newsletterCategories.find( c => c.id === termId );
			return cat ? cat.name : null;
		} )
		.filter( Boolean );
	const hasUnknown = postCategories.some(
		termId => ! newsletterCategories.some( c => c.id === termId )
	);
	if ( hasUnknown ) {
		categoryNames.push( __( 'All content', 'jetpack' ) );
	}
	const formatted = categoryNames.map( n => `<strong>${ n }</strong>` );
	if ( formatted.length === 1 ) return formatted[ 0 ];
	if ( formatted.length === 2 ) {
		return sprintf(
			/* translators: %1$s: first category, %2$s: second category */
			__( '%1$s and %2$s', 'jetpack' ),
			formatted[ 0 ],
			formatted[ 1 ]
		);
	}
	const allButLast = formatted.slice( 0, -1 ).join( `${ __( ',', 'jetpack' ) } ` );
	return sprintf(
		/* translators: %1$s: comma-separated categories, %2$s: last category */
		__( '%1$s, and %2$s', 'jetpack' ),
		allButLast,
		formatted[ formatted.length - 1 ]
	);
}

/**
 * Get access level label for "was emailed to X" copy from stats access_level string.
 *
 * @param {string} accessLevel - e.g. 'everybody', 'subscribers', 'paid_subscribers'
 * @return {string} Access level label for display (e.g. "all subscribers", "paid subscribers").
 */
function getAccessLevelLabelFromStats( accessLevel ) {
	if ( ! accessLevel ) return __( 'all subscribers', 'jetpack' );
	const key = accessLevel.startsWith( 'paid_subscribers' ) ? 'paid_subscribers' : accessLevel;
	switch ( key ) {
		case 'everybody':
			return __( 'all subscribers', 'jetpack' );
		case 'subscribers':
			return __( 'all subscribers', 'jetpack' );
		case 'paid_subscribers':
			return __( 'paid subscribers', 'jetpack' );
		default:
			return __( 'all subscribers', 'jetpack' );
	}
}

/**
 * Build "was sent" or "is being sent" copy for access + categories.
 *
 * @param {object}  opts
 * @param {string}  opts.accessLabel   - "all subscribers" or "paid subscribers"
 * @param {string}  opts.categoryNames - Formatted category list (or empty)
 * @param {boolean} opts.pastTense     - "was emailed" vs "is being emailed"
 * @param {string}  opts.dateStr       - For past tense only
 * @return {string} Formatted sentence for "was sent" or "is being sent" copy.
 */
function getSentCopyLine( { accessLabel, categoryNames, pastTense, dateStr } ) {
	if ( categoryNames ) {
		if ( pastTense ) {
			return sprintf(
				/* translators: %1$s: access (e.g. "all subscribers"), %2$s: category list, %3$s: date */
				__(
					'This post was emailed to %1$s of %2$s on %3$s. View delivery details on <link>your email stats page</link>.',
					'jetpack'
				),
				accessLabel,
				categoryNames,
				dateStr
			);
		}
		return sprintf(
			/* translators: %1$s: access, %2$s: category list */
			__(
				'This post is being emailed to %1$s of %2$s. Delivery details can be seen on <link>your email stats page</link> shortly.',
				'jetpack'
			),
			accessLabel,
			categoryNames
		);
	}
	if ( pastTense ) {
		return sprintf(
			/* translators: %1$s: access, %2$s: date */
			__(
				'This post was emailed to %1$s on %2$s. View delivery details on <link>your email stats page</link>.',
				'jetpack'
			),
			accessLabel,
			dateStr
		);
	}
	return sprintf(
		/* translators: %s: access level */
		__(
			'This post is being emailed to %s. Delivery details can be seen on <link>your email stats page</link> shortly.',
			'jetpack'
		),
		accessLabel
	);
}

/*
 * Determines copy to show in pre/post-publish panels to confirm number and type of subscribers receiving the post as email.
 */
function SubscribersAffirmation( { accessLevel, prePublish = false } ) {
	const wasPublishedOnLoad = useRef( undefined );
	const transitionedToPublishInSession = useRef( false );
	const prevStatusRef = useRef( null );

	const postHasPaywallBlock = useSelect( select =>
		select( 'core/block-editor' )
			.getBlocks()
			.some( block => block.name === paywallBlockMetadata.name )
	);

	const { isScheduledPost, postCategories, postId, postMeta, publishDate, status } = useSelect(
		select => {
			const { isCurrentPostScheduled, getEditedPostAttribute, getCurrentPost } =
				select( editorStore );
			const post = getCurrentPost();
			const statusVal = post?.status;
			const dateVal = post?.date;
			const publishTime = dateVal ? new Date( dateVal ) : null;

			return {
				isScheduledPost: isCurrentPostScheduled(),
				postCategories: getEditedPostAttribute( 'categories' ),
				postId: post?.id,
				postMeta: getEditedPostAttribute( 'meta' ),
				publishDate: publishTime,
				status: statusVal,
			};
		}
	);

	const isSendEmailEnabled = () => {
		return ! postMeta?.[ META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS ];
	};

	const blogId = window.Jetpack_Editor_Initial_State?.wpcomBlogId;
	const dispatch = useDispatch( membershipProductsStore );
	const {
		emailSubscribersCount,
		hasFinishedLoading,
		newsletterCategories,
		newsletterCategoriesEnabled,
		newsletterCategorySubscriberCount,
		paidSubscribersCount,
		postEmailSentState,
		republishedAlreadySentInSession,
		publishedWithEmailEnabledInSession,
	} = useSelect(
		select => {
			const {
				getNewsletterCategories,
				getNewsletterCategoriesEnabled,
				getNewsletterCategoriesSubscriptionsCount,
				getPostEmailSentState,
				getPublishedWithEmailEnabledInSession,
				getRepublishedAlreadySentPostInSession,
				getSubscriberCounts,
				hasFinishedResolution,
			} = select( membershipProductsStore );

			const { emailSubscribers, paidSubscribers } = getSubscriberCounts();

			// Trigger fetch when we have a postId so we have email_sent_at / stats_on_send (including for draft)
			if ( postId ) {
				getPostEmailSentState( postId );
			}

			const postEmailResolved =
				status !== 'publish' ||
				( !! postId && hasFinishedResolution( 'getPostEmailSentState', [ postId ] ) );

			return {
				hasFinishedLoading: [
					hasFinishedResolution( 'getSubscriberCounts' ),
					hasFinishedResolution( 'getNewsletterCategories' ),
					hasFinishedResolution( 'getNewsletterCategoriesSubscriptionsCount' ),
					postEmailResolved,
				].every( Boolean ),
				emailSubscribersCount: emailSubscribers,
				newsletterCategories: getNewsletterCategories(),
				newsletterCategoriesEnabled: getNewsletterCategoriesEnabled(),
				newsletterCategorySubscriberCount: getNewsletterCategoriesSubscriptionsCount(),
				paidSubscribersCount: paidSubscribers,
				postEmailSentState: postId ? getPostEmailSentState( postId ) : null,
				republishedAlreadySentInSession: postId
					? getRepublishedAlreadySentPostInSession( postId )
					: false,
				publishedWithEmailEnabledInSession: postId
					? getPublishedWithEmailEnabledInSession( postId )
					: false,
			};
		},
		[ status, postId ]
	);

	useEffect( () => {
		if ( status === 'publish' ) {
			if ( wasPublishedOnLoad.current === undefined ) {
				wasPublishedOnLoad.current = true;
			}
			if ( prevStatusRef.current !== null && prevStatusRef.current !== 'publish' ) {
				transitionedToPublishInSession.current = true;
				if ( postId ) {
					if ( postEmailSentState?.email_sent_at != null ) {
						dispatch( setRepublishedAlreadySentPostInSession( postId ) );
					}
					if ( ! postMeta?.[ META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS ] ) {
						dispatch( setPublishedWithEmailEnabledInSession( postId ) );
					}
				}
			}
		}
		prevStatusRef.current = status;
	}, [ status, postId, postEmailSentState?.email_sent_at, dispatch, postMeta ] );

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
	const futureTense = prePublish || isScheduledPost;

	const emailSentAt = postEmailSentState?.email_sent_at ?? null;
	const statsOnSend = postEmailSentState?.stats_on_send ?? null;

	const isAlreadySent = emailSentAt != null;
	const isSendingInProgress =
		status === 'publish' &&
		isSendEmailEnabled() &&
		emailSentAt == null &&
		( transitionedToPublishInSession.current ||
			publishedWithEmailEnabledInSession ||
			( wasPublishedOnLoad.current &&
				publishDate &&
				publishDate.getTime() >= Date.now() - SENDING_IN_PROGRESS_WINDOW_MS ) );
	const isPublishedNotSent =
		status === 'publish' && isSendEmailEnabled() && emailSentAt == null && ! isSendingInProgress;

	const reachForAccessLevel = getReachForAccessLevelKey( {
		accessLevel,
		subscribers: emailSubscribersCount,
		paidSubscribers: paidSubscribersCount,
		postHasPaywallBlock,
	} );

	let text;
	let append = '';

	if ( ! isSendEmailEnabled() ) {
		// "Post only" but already emailed: show "was sent" copy, not "Not sent via email"
		if ( isAlreadySent && statsOnSend ) {
			const dateStr = formatSentDate( emailSentAt, statsOnSend.timestamp );
			const accessLabel = getAccessLevelLabelFromStats( statsOnSend.access_level );
			const categoryNames = getCategoryNamesFromStats(
				statsOnSend.post_categories,
				newsletterCategories
			);
			text = getSentCopyLine( {
				accessLabel,
				categoryNames,
				pastTense: true,
				dateStr,
			} );
		} else if ( isAlreadySent ) {
			text = sprintf(
				/* translators: %s: formatted date */
				__(
					'This post was emailed on %s. View delivery details on <link>your email stats page</link>.',
					'jetpack'
				),
				formatSentDate( emailSentAt, null )
			);
		} else if ( status === 'publish' ) {
			text = __(
				"This post was published without sending an email. To send, move the post to draft, enable 'Post and email,' and republish.",
				'jetpack'
			);
		} else {
			text = __( 'Not sent via email.', 'jetpack' );
		}
	} else if ( isComingSoon() ) {
		text = __(
			'Your site is in Coming Soon mode. Emails are sent only when your site is public.',
			'jetpack'
		);
	} else if ( isAlreadySent ) {
		const dateStr = formatSentDate( emailSentAt, statsOnSend?.timestamp ?? null );
		if ( statsOnSend ) {
			const accessLabel = getAccessLevelLabelFromStats( statsOnSend.access_level );
			const categoryNames = getCategoryNamesFromStats(
				statsOnSend.post_categories,
				newsletterCategories
			);
			text = getSentCopyLine( {
				accessLabel,
				categoryNames,
				pastTense: true,
				dateStr,
			} );
		} else {
			text = sprintf(
				/* translators: %s: formatted date */
				__(
					'This post was emailed on %s. View delivery details on <link>your email stats page</link>.',
					'jetpack'
				),
				dateStr
			);
		}
		if ( transitionedToPublishInSession.current || republishedAlreadySentInSession ) {
			append = __( 'Updating or republishing does not send a new email.', 'jetpack' );
		}
		const statsAccess = statsOnSend?.access_level;
		const statsCats = statsOnSend?.post_categories ?? [];
		const accessMatches =
			! statsAccess || statsAccess === accessLevel || statsAccess.startsWith( accessLevel );
		const categoriesMatch =
			! statsOnSend?.has_newsletter_categories ||
			( Array.isArray( postCategories ) &&
				statsCats.length === postCategories.length &&
				statsCats.every( ( id, i ) => postCategories[ i ] === id ) );
		if ( ! accessMatches || ! categoriesMatch ) {
			append = append
				? append + ' ' + __( 'Changing access settings does not resend the email.', 'jetpack' )
				: __( 'Changing access settings does not resend the email.', 'jetpack' );
		}
	} else if ( isSendingInProgress ) {
		const accessLabel = getAccessLevelLabelFromStats( accessLevel );
		const categoryNames =
			newsletterCategoriesEnabled && newsletterCategories?.length && postCategories?.length
				? getFormattedCategories( postCategories, newsletterCategories )
				: '';
		text = getSentCopyLine( {
			accessLabel,
			categoryNames,
			pastTense: false,
			dateStr: '',
		} );
	} else if ( isPublishedNotSent ) {
		text = __(
			"This post was published without sending an email. To send, move the post to draft, enable 'Post and email,' and republish.",
			'jetpack'
		);
	} else if ( futureTense ) {
		// Pre-send: "will be sent" with subscriber counts
		if ( newsletterCategoriesEnabled && newsletterCategories.length > 0 && ! isPaidPost ) {
			text = getCopyForCategorySubscribers( {
				futureTense: true,
				isPaidPost,
				newsletterCategories,
				postCategories,
				reachCount: newsletterCategorySubscriberCount,
			} );
		} else {
			text = getCopyForSubscribers( {
				futureTense: true,
				isPaidPost,
				postHasPaywallBlock,
				reachCount: reachForAccessLevel,
			} );
		}
	} else if ( newsletterCategoriesEnabled && newsletterCategories.length > 0 && ! isPaidPost ) {
		// Published, not sent, not sending in progress (fallback) — category subscribers
		text = getCopyForCategorySubscribers( {
			futureTense: false,
			isPaidPost,
			newsletterCategories,
			postCategories,
			reachCount: newsletterCategorySubscriberCount,
		} );
	} else {
		// Published, not sent, not sending in progress (fallback) — all/paid subscribers
		text = getCopyForSubscribers( {
			futureTense: false,
			isPaidPost,
			postHasPaywallBlock,
			reachCount: reachForAccessLevel,
		} );
	}

	return (
		<p>
			{ createInterpolateElement( text, {
				strong: <strong />,
				link: <a href={ getJetpackEmailStatsLink( blogId, postId ) } />,
			} ) }
			{ append ? <> { createInterpolateElement( append, { strong: <strong /> } ) }</> : null }
		</p>
	);
}

/**
 * Get the Jetpack email stats link for the given post ID.
 *
 * @param {number} blogId - The ID of the blog.
 * @param {number} postId - The ID of the post.
 *
 * @return {string} - The Jetpack email stats link for the given post.
 */
function getJetpackEmailStatsLink( blogId, postId ) {
	return getAdminUrl( `admin.php?page=stats#!/stats/email/opens/day/${ postId }/${ blogId }` );
}

export default SubscribersAffirmation;
