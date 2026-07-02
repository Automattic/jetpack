import { getAdminUrl } from '@automattic/jetpack-script-data';
import { isComingSoon } from '@automattic/jetpack-shared-extension-utils';
import { Animate } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { createInterpolateElement } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import paywallBlockMetadata from '../../blocks/paywall/block.json';
import {
	accessOptions,
	META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS,
	META_NAME_FOR_POST_TIER_ID_SETTINGS,
} from '../../shared/memberships/constants';
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
	let formattedCategories;

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

const SENDING_IN_PROGRESS_WINDOW_MS = 15 * 60 * 1000;

/**
 * Get access level label for display. Accepts base access level and optional tier name.
 *
 * @param {string}      accessLevel - Base key e.g. 'everybody', 'subscribers', 'paid_subscribers'.
 * @param {string|null} [tierName]  - Optional tier name for paid subscribers (e.g. "Premium").
 * @return {string} Access level label for display (e.g. "all subscribers", "paid subscribers (Premium)").
 */
export function getAccessLevelLabel( accessLevel, tierName = null ) {
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
 * Get access label for affirmation copy, accounting for paywall.
 * When paid_subscribers post has a paywall block, email goes to all subscribers.
 *
 * @param {string}      accessLevel           - Base key e.g. 'paid_subscribers'.
 * @param {string|null} [tierName]            - Optional tier name.
 * @param {boolean}     [postHasPaywallBlock] - Whether the post contains a paywall block.
 * @return {string} Access level label for display.
 */
export function getAccessLabelForCopy( accessLevel, tierName = null, postHasPaywallBlock = false ) {
	if ( accessLevel === 'paid_subscribers' && postHasPaywallBlock ) {
		return __( 'all subscribers', 'jetpack' );
	}
	return getAccessLevelLabel( accessLevel, tierName );
}

/**
 * Get the current tier name from editor post meta and tier products.
 *
 * @param {string} accessLevel  - Current access level (e.g. 'paid_subscribers').
 * @param {object} postMeta     - Post meta including tier ID.
 * @param {Array}  tierProducts - Newsletter tier products.
 * @return {string|null} Tier name when paid subscribers with a tier is selected, null otherwise.
 */
export function getCurrentTierName( accessLevel, postMeta, tierProducts ) {
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
export function shouldShowWontResendMessage( {
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
 * Build "was sent", "is being sent", or "will be sent" copy for access + categories.
 *
 * @param {object} opts               - Options object.
 * @param {string} opts.accessLabel   - "all subscribers" or "paid subscribers" (may be empty for date-only case).
 * @param {string} opts.categoryNames - Formatted category list (or empty).
 * @param {string} opts.tense         - 'past' | 'present' | 'future'.
 * @param {string} opts.dateStr       - For past tense only.
 * @return {string} Formatted sentence for "was sent", "is being sent", or "will be sent" copy.
 */
export function getSentCopyLine( { accessLabel, categoryNames, tense, dateStr } ) {
	const isPast = tense === 'past';
	const isFuture = tense === 'future';

	if ( isPast && dateStr && ! accessLabel ) {
		return sprintf(
			/* translators: %s: formatted date */
			__( 'This post was emailed on %s. View <link>delivery details</link>.', 'jetpack' ),
			dateStr
		);
	}
	if ( categoryNames ) {
		if ( isPast ) {
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
		if ( isFuture ) {
			return sprintf(
				/* translators: %1$s: access, %2$s: category list */
				__( 'This post will be emailed to %1$s of %2$s.', 'jetpack' ),
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
	if ( isPast ) {
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
	if ( isFuture ) {
		return sprintf(
			/* translators: %s: access level */
			__( 'This post will be emailed to %s.', 'jetpack' ),
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
		hasFinishedLoading,
		newsletterCategories,
		newsletterCategoriesEnabled,
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
				getNewsletterTierProducts,
				getPostEmailSentState,
				getPublishedWithEmailEnabledInSession,
				getAlreadySentPostModifiedInSession,
				getTotalEmailsSentCount,
				hasFinishedResolution,
			} = select( membershipProductsStore );

			// Trigger fetch when we have a postId so we have email_sent_at / stats_on_send (including for draft)
			if ( postId ) {
				getPostEmailSentState( postId );
			}

			const postEmailResolved =
				! postId || hasFinishedResolution( 'getPostEmailSentState', [ postId ] );

			const _postEmailSentState = postId ? getPostEmailSentState( postId ) : null;
			const emailSentAt = _postEmailSentState?.email_sent_at ?? null;
			// Only fetch email open stats for already-published posts. Drafts,
			// auto-drafts, pending, and scheduled posts have never been emailed,
			// so the WPCOM stats/opens/emails request would be a guaranteed miss
			// (and can time out on large sites). See NL-578.
			const shouldFetchTotalEmails =
				postId && blogId && postEmailResolved && emailSentAt == null && status === 'publish';

			return {
				hasFinishedLoading: [
					hasFinishedResolution( 'getNewsletterCategories' ),
					postEmailResolved,
				].every( Boolean ),
				newsletterCategories: getNewsletterCategories(),
				newsletterCategoriesEnabled: getNewsletterCategoriesEnabled(),
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
		[ postId, blogId, status ]
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

	const isPrepublishOrScheduled = prePublish || isScheduledPost;

	const emailSentAt = postEmailSentState?.email_sent_at ?? null;
	const statsOnSend = postEmailSentState?.stats_on_send ?? null;

	const dateStr =
		postEmailSentState?.email_sent_at ?? postEmailSentState?.stats_on_send?.timestamp ?? '';

	const sentAccessLabel = statsOnSend
		? getAccessLabelForCopy(
				statsOnSend.access_level,
				statsOnSend.paid_tier ?? null,
				statsOnSend.has_paywall_block === true
		  )
		: '';
	const sentCategoryNames = statsOnSend
		? getFormattedCategories( statsOnSend.post_categories, newsletterCategories, false )
		: '';
	const currentTierName = getCurrentTierName( accessLevel, postMeta, tierProducts );
	const accessLabelFromSettings = getAccessLabelForCopy(
		accessLevel,
		currentTierName,
		postHasPaywallBlock
	);
	const categoryNamesFromSettings =
		newsletterCategoriesEnabled && newsletterCategories?.length && postCategories?.length
			? getFormattedCategories( postCategories, newsletterCategories )
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

	let text;
	let showWontResendMessage = false;

	if ( isAlreadySent ) {
		text = getSentCopyLine( {
			accessLabel: sentAccessLabel,
			categoryNames: sentCategoryNames,
			tense: 'past',
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
			'Your site is in Coming Soon mode. Emails are sent only when your site is public. <visibilityLink>Update your site visibility</visibilityLink>.',
			'jetpack'
		);
	} else if ( isSendingInProgress ) {
		text = getSentCopyLine( {
			accessLabel: accessLabelFromSettings,
			categoryNames: categoryNamesFromSettings,
			tense: 'present',
			dateStr: '',
		} );
	} else if ( isPublishedWithoutEmail ) {
		text = __(
			"This post was published without sending an email. To send, move the post to draft, enable 'Post and email,' and republish.",
			'jetpack'
		);
	} else if ( ! isSendEmailEnabled() ) {
		text = __( 'Not sent via email.', 'jetpack' );
	} else {
		// Pre-send (prepublish/scheduled) — unified access + categories
		text = getSentCopyLine( {
			accessLabel: accessLabelFromSettings,
			categoryNames: categoryNamesFromSettings,
			tense: isPrepublishOrScheduled ? 'future' : 'present',
			dateStr: '',
		} );
	}

	return (
		<>
			<p>
				{ createInterpolateElement( text, {
					strong: <strong />,
					link: <a href={ getJetpackEmailStatsLink( blogId, postId ) } />,
					visibilityLink: <a href={ getSiteVisibilitySettingsLink() } />,
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
export function getJetpackEmailStatsLink( blogId, postId ) {
	return getAdminUrl( `admin.php?page=stats#!/stats/email/opens/day/${ postId }/${ blogId }` );
}

/**
 * Get the link to the site visibility settings, where a user can take their site
 * out of Coming Soon mode. The Coming Soon / privacy controls live on the Reading
 * settings page (see the `blog_privacy_selector` hook).
 *
 * @return {string} - The admin URL for the Reading settings page.
 */
export function getSiteVisibilitySettingsLink() {
	return getAdminUrl( 'options-reading.php' );
}

export default SubscribersAffirmation;
