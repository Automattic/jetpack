import { getAdminUrl } from '@automattic/jetpack-script-data';
import { isComingSoon } from '@automattic/jetpack-shared-extension-utils';
import { Animate } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { createInterpolateElement } from '@wordpress/element';
import { sprintf, __, _n } from '@wordpress/i18n';
import paywallBlockMetadata from '../../blocks/paywall/block.json';
import {
	accessOptions,
	META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS,
	META_NAME_FOR_POST_TIER_ID_SETTINGS,
} from '../../shared/memberships/constants';
import { getReachForAccessLevelKey } from '../../shared/memberships/settings';
import { store as membershipProductsStore } from '../../store/membership-products';

/**
 * Get the formatted list of categories for a post.
 * @param {Array}   postCategories                 - list of category IDs for the post (from editor or stats_on_send)
 * @param {Array}   newsletterCategories           - list of the site's newsletter categories
 * @param {boolean} [fallbackToUncategorized=true] - if false and empty, return ''; if true, treat empty as [1]
 * @return {string} - formatted list of categories
 */
export const getFormattedCategories = (
	postCategories,
	newsletterCategories,
	fallbackToUncategorized = true
) => {
	if ( ! fallbackToUncategorized && ! postCategories?.length ) return '';

	// If the post has no categories, then it's going to have the 'Uncategorized' category
	const updatedPostCategories = postCategories?.length ? postCategories : [ 1 ];

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
 * Get access level label for display. Accepts base access level and optional tier name.
 *
 * @param {string}      accessLevel - Base key e.g. 'everybody', 'subscribers', 'paid_subscribers'.
 * @param {string|null} [tierName]  - Optional tier name for paid subscribers (e.g. "Premium").
 * @return {string} Access level label for display (e.g. "all subscribers", "paid subscribers (Premium)").
 */
function getAccessLevelLabel( accessLevel, tierName = null ) {
	if ( ! accessLevel ) return __( 'all subscribers', 'jetpack' );

	let label;
	switch ( accessLevel ) {
		case 'everybody':
			label = __( 'all subscribers', 'jetpack' );
			break;
		case 'subscribers':
			label = __( 'all subscribers', 'jetpack' );
			break;
		case 'paid_subscribers':
			label = __( 'paid subscribers', 'jetpack' );
			break;
		default:
			label = __( 'all subscribers', 'jetpack' );
	}

	if ( tierName && accessLevel === 'paid_subscribers' ) {
		return sprintf(
			// translators: %1$s: access level label (e.g. "paid subscribers"), %2$s: tier name (e.g. "Premium")
			__( '%1$s (%2$s)', 'jetpack' ),
			label,
			tierName
		);
	}
	return label;
}

/**
 * Get the current tier name from editor post meta and tier products.
 *
 * @param {string} accessLevel  - Current access level (e.g. 'paid_subscribers').
 * @param {object} postMeta     - Post meta including tier ID.
 * @param {Array}  tierProducts - Newsletter tier products.
 * @return {string|null} Tier name when paid subscribers with a tier is selected, null otherwise.
 */
function getCurrentTierName( accessLevel, postMeta, tierProducts ) {
	const tierId = postMeta?.[ META_NAME_FOR_POST_TIER_ID_SETTINGS ];
	return accessLevel === accessOptions.paid_subscribers.key && tierId
		? tierProducts?.find( p => String( p.id ) === String( tierId ) )?.title ?? null
		: null;
}

/**
 * Determine if we should show the "won't resend" message for an already-sent post.
 * Returns true when the post was modified in-session, we're in pre-publish view,
 * or access/category settings no longer match what was used when the email was sent.
 *
 * @param {object}  opts                                  - Options.
 * @param {object}  opts.statsOnSend                      - Stats from when the email was sent.
 * @param {object}  opts.postMeta                         - Current post meta.
 * @param {string}  opts.accessLevel                      - Current access level.
 * @param {Array}   opts.tierProducts                     - Tier products for matching.
 * @param {Array}   opts.postCategories                   - Current post categories.
 * @param {boolean} opts.alreadySentPostModifiedInSession - Whether post was modified since send.
 * @param {boolean} opts.prePublish                       - Whether we're in pre-publish context.
 * @return {boolean} True if the "won't resend" message should be shown.
 */
function shouldShowWontResendMessage( {
	statsOnSend,
	postMeta,
	accessLevel,
	tierProducts,
	postCategories,
	alreadySentPostModifiedInSession,
	prePublish,
} ) {
	const statsBase = statsOnSend?.access_level;
	const statsTierName = statsOnSend?.paid_tier ?? null;
	const statsCats = statsOnSend?.post_categories ?? [];
	const currentTierName = getCurrentTierName( accessLevel, postMeta, tierProducts );

	const baseMatches = ! statsBase || statsBase === accessLevel;
	const tierMatches =
		( ! statsTierName && ! currentTierName ) ||
		( statsTierName && currentTierName && statsTierName === currentTierName );
	const accessMatches = baseMatches && tierMatches;

	const categoriesMatch =
		! statsOnSend?.has_newsletter_categories ||
		( Array.isArray( postCategories ) &&
			statsCats.length === postCategories.length &&
			statsCats.every( id => postCategories.includes( id ) ) );

	return alreadySentPostModifiedInSession || prePublish || ! accessMatches || ! categoriesMatch;
}

/**
 * Build "was sent" or "is being sent" copy for access + categories.
 *
 * @param {object}  opts
 * @param {string}  opts.accessLabel   - "all subscribers" or "paid subscribers" (may be empty for date-only case)
 * @param {string}  opts.categoryNames - Formatted category list (or empty)
 * @param {boolean} opts.pastTense     - "was emailed" vs "is being emailed"
 * @param {string}  opts.dateStr       - For past tense only
 * @return {string} Formatted sentence for "was sent" or "is being sent" copy.
 */
function getSentCopyLine( { accessLabel, categoryNames, pastTense, dateStr } ) {
	if ( pastTense && dateStr && ! accessLabel ) {
		return sprintf(
			/* translators: %s: formatted date */
			__( 'This post was emailed on %s. View <link>delivery details</link>.', 'jetpack' ),
			dateStr
		);
	}
	if ( categoryNames ) {
		if ( pastTense ) {
			if ( dateStr ) {
				return sprintf(
					/* translators: %1$s: access (e.g. "all subscribers"), %2$s: category list, %3$s: date */
					__(
						'This post was emailed to %1$s of %2$s on %3$s. View <link>delivery details</link>.',
						'jetpack'
					),
					accessLabel,
					categoryNames,
					dateStr
				);
			}
			return sprintf(
				/* translators: %1$s: access (e.g. "all subscribers"), %2$s: category list */
				__(
					'This post was emailed to %1$s of %2$s. View <link>delivery details</link>.',
					'jetpack'
				),
				accessLabel,
				categoryNames
			);
		}
		return sprintf(
			/* translators: %1$s: access, %2$s: category list */
			__(
				'This post is being emailed to %1$s of %2$s. <link>Delivery details</link> will be available shortly.',
				'jetpack'
			),
			accessLabel,
			categoryNames
		);
	}
	if ( pastTense ) {
		if ( dateStr ) {
			return sprintf(
				/* translators: %1$s: access, %2$s: date */
				__(
					'This post was emailed to %1$s on %2$s. View <link>delivery details</link>.',
					'jetpack'
				),
				accessLabel,
				dateStr
			);
		}
		return sprintf(
			/* translators: %s: access */
			__( 'This post was emailed to %s. View <link>delivery details</link>.', 'jetpack' ),
			accessLabel
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
		// Meta value is negated, "don't send", but toggle is truthy when enabled "send"
		return ! postMeta?.[ META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS ];
	};

	const blogId = window.Jetpack_Editor_Initial_State?.wpcomBlogId;
	const {
		emailSubscribersCount,
		hasFinishedLoading,
		newsletterCategories,
		newsletterCategoriesEnabled,
		newsletterCategorySubscriberCount,
		paidSubscribersCount,
		postEmailSentState,
		tierProducts,
		totalEmailsSentCount,
		alreadySentPostModifiedInSession,
		publishedWithEmailEnabledInSession,
	} = useSelect(
		select => {
			const {
				getNewsletterCategories,
				getNewsletterCategoriesEnabled,
				getNewsletterCategoriesSubscriptionsCount,
				getNewsletterTierProducts,
				getPostEmailSentState,
				getPublishedWithEmailEnabledInSession,
				getAlreadySentPostModifiedInSession,
				getSubscriberCounts,
				getTotalEmailsSentCount,
				hasFinishedResolution,
			} = select( membershipProductsStore );

			const { emailSubscribers, paidSubscribers } = getSubscriberCounts();

			// Trigger fetch when we have a postId so we have email_sent_at / stats_on_send (including for draft)
			if ( postId ) {
				getPostEmailSentState( postId );
			}

			const postEmailResolved =
				! postId || hasFinishedResolution( 'getPostEmailSentState', [ postId ] );

			const _postEmailSentState = postId ? getPostEmailSentState( postId ) : null;
			const emailSentAt = _postEmailSentState?.email_sent_at ?? null;
			const shouldFetchTotalEmails = postId && blogId && postEmailResolved && emailSentAt == null;

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
				postEmailSentState: _postEmailSentState,
				alreadySentPostModifiedInSession: postId
					? getAlreadySentPostModifiedInSession( postId )
					: false,
				publishedWithEmailEnabledInSession: postId
					? getPublishedWithEmailEnabledInSession( postId )
					: false,
				tierProducts: getNewsletterTierProducts(),
				totalEmailsSentCount: shouldFetchTotalEmails
					? getTotalEmailsSentCount( blogId, postId )
					: null,
			};
		},
		[ postId, blogId ]
	);

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
	const isPrepublishOrScheduled = prePublish || isScheduledPost;

	const emailSentAt = postEmailSentState?.email_sent_at ?? null;
	const statsOnSend = postEmailSentState?.stats_on_send ?? null;

	const dateStr =
		postEmailSentState?.email_sent_at ?? postEmailSentState?.stats_on_send?.timestamp ?? '';

	const sentAccessLabel = statsOnSend
		? getAccessLevelLabel( statsOnSend.access_level, statsOnSend.paid_tier )
		: '';
	const sentCategoryNames = statsOnSend
		? getFormattedCategories( statsOnSend.post_categories, newsletterCategories, false )
		: '';

	const isAlreadySent = emailSentAt != null || statsOnSend;
	const isStatsOnlyFallback = ! isAlreadySent && ( totalEmailsSentCount ?? 0 ) > 0;
	const isSendingInProgress =
		status === 'publish' &&
		isSendEmailEnabled() &&
		// emailSentAt (email_notification meta) is what prevents duplicate sends, regardless of statsOnSend or stats count fallbacks.
		emailSentAt == null &&
		( publishedWithEmailEnabledInSession ||
			( publishDate && publishDate.getTime() >= Date.now() - SENDING_IN_PROGRESS_WINDOW_MS ) );
	const isPublishedWithoutEmail =
		status === 'publish' && emailSentAt == null && ! isSendingInProgress;

	const reachForAccessLevel = getReachForAccessLevelKey( {
		accessLevel,
		subscribers: emailSubscribersCount,
		paidSubscribers: paidSubscribersCount,
		postHasPaywallBlock,
	} );

	let text;
	let showWontResendMessage = false;

	if ( isAlreadySent ) {
		text = getSentCopyLine( {
			accessLabel: sentAccessLabel,
			categoryNames: sentCategoryNames,
			pastTense: true,
			dateStr,
		} );

		if ( isSendEmailEnabled() && emailSentAt !== null ) {
			showWontResendMessage = shouldShowWontResendMessage( {
				statsOnSend,
				postMeta,
				accessLevel,
				tierProducts,
				postCategories,
				alreadySentPostModifiedInSession,
				prePublish,
			} );
		}
	} else if ( isStatsOnlyFallback ) {
		text = __(
			'This post was emailed to subscribers. View <link>delivery details</link>.',
			'jetpack'
		);
	} else if ( isComingSoon() ) {
		text = __(
			'Your site is in Coming Soon mode. Emails are sent only when your site is public.',
			'jetpack'
		);
	} else if ( isSendingInProgress ) {
		const currentTierName = getCurrentTierName( accessLevel, postMeta, tierProducts );
		const accessLabel = getAccessLevelLabel( accessLevel, currentTierName );
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
	} else if ( isPublishedWithoutEmail ) {
		text = __(
			"This post was published without sending an email. To send, move the post to draft, enable 'Post and email,' and republish.",
			'jetpack'
		);
	} else if ( ! isSendEmailEnabled() ) {
		text = __( 'Not sent via email.', 'jetpack' );
	} else if ( newsletterCategoriesEnabled && newsletterCategories.length > 0 && ! isPaidPost ) {
		// Pre-send (prepublish/scheduled) or published fallback — category subscribers
		text = getCopyForCategorySubscribers( {
			futureTense: isPrepublishOrScheduled,
			newsletterCategories,
			postCategories,
			reachCount: newsletterCategorySubscriberCount,
		} );
	} else {
		// Pre-send (prepublish/scheduled) or published fallback — all/paid subscribers
		text = getCopyForSubscribers( {
			futureTense: isPrepublishOrScheduled,
			isPaidPost,
			postHasPaywallBlock,
			reachCount: reachForAccessLevel,
		} );
	}

	return (
		<>
			<p>
				{ createInterpolateElement( text, {
					strong: <strong />,
					link: <a href={ getJetpackEmailStatsLink( blogId, postId ) } />,
				} ) }
			</p>
			{ showWontResendMessage && (
				<p>
					{ createInterpolateElement(
						__(
							"Updating, republishing, or changing access settings <strong>won't</strong> resend the email.",
							'jetpack'
						),
						{ strong: <strong /> }
					) }
				</p>
			) }
		</>
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
