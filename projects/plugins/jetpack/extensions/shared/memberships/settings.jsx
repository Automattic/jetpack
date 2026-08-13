import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import { formatNumberCompact } from '@automattic/number-formatters';
import {
	Button,
	Flex,
	FlexBlock,
	RadioControl,
	Spinner,
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useInstanceId, useViewportMatch } from '@wordpress/compose';
import { useEntityId, useEntityProp, store as coreDataStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { PostVisibilityCheck, store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import { Link as ExternalLink } from '@wordpress/ui';
import paywallBlockMetadata from '../../blocks/paywall/block.json';
import { store as membershipProductsStore } from '../../store/membership-products';
import './settings.scss';
import {
	accessOptions,
	META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS,
	META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS,
	META_NAME_FOR_POST_TIER_ID_SETTINGS,
} from './constants';
import { getPaidPlanLink, getShowMisconfigurationWarning, MisconfigurationWarning } from './utils';

const paywallIcon = getBlockIconComponent( paywallBlockMetadata );

export function Link( { href, children } ) {
	return (
		<a target="_blank" rel="noopener noreferrer" href={ href } className="jetpack-newsletter-link">
			{ children }
		</a>
	);
}

export function getReachForAccessLevelKey( {
	accessLevel,
	subscribers, // This can be either total subscribers or email subscribers depending on the view where this is used.
	paidSubscribers,
	postHasPaywallBlock = false,
} ) {
	subscribers = subscribers ?? 0;
	paidSubscribers = paidSubscribers ?? 0;

	switch ( accessOptions[ accessLevel ]?.key ) {
		case accessOptions.everybody.key:
			return subscribers;
		case accessOptions.subscribers.key:
			return subscribers;
		case accessOptions.paid_subscribers.key:
			return postHasPaywallBlock ? subscribers : paidSubscribers;
		default:
			return 0;
	}
}

/**
 * Describe, in plain language, who can read the post and who receives it by email.
 *
 * Email reach is not always the same as read access: when the post contains a paywall
 * block, every subscriber is emailed the portion above the paywall, so a paid post
 * still goes out to the full list. See getAccessLabelForCopy in subscribers-affirmation.
 *
 * @param {string}  accessLevel         - Access level key, e.g. 'paid_subscribers'.
 * @param {boolean} postHasPaywallBlock - Whether the post contains a paywall block.
 * @return {string} Description of the current access level.
 */
export function getAccessDescription( accessLevel, postHasPaywallBlock = false ) {
	// The unused third argument to __() keeps the two calls in each branch from being
	// merged into a single __( cond ? a : b ) by the production minifier, which would
	// leave a non-literal msgid and fail the i18n check.
	switch ( accessLevel ) {
		case accessOptions.subscribers.key:
			return postHasPaywallBlock
				? __(
						'Only subscribers can read the content below the paywall. Subscribers receive it by email.',
						'jetpack',
						0
				  )
				: __(
						'Only subscribers can read this post. Others see a preview and can subscribe. Subscribers receive it by email.',
						'jetpack'
				  );
		case accessOptions.paid_subscribers.key:
			return postHasPaywallBlock
				? __(
						'Only paid subscribers can read the content below the paywall. All subscribers receive it by email.',
						'jetpack',
						0
				  )
				: __(
						'Only paid subscribers can read this post. Others see a preview and can subscribe. Only paid subscribers receive it by email.',
						'jetpack'
				  );
		default:
			return __( 'Anyone can read this post. Subscribers receive it by email.', 'jetpack' );
	}
}

export function useSetAccess() {
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	const [ metas, setPostMeta ] = useEntityProp( 'postType', postType, 'meta' );
	return value => {
		// We are removing the tier ID meta
		delete metas[ META_NAME_FOR_POST_TIER_ID_SETTINGS ];
		setPostMeta( {
			...metas,
			[ META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS ]: value,
		} );
	};
}

export function useSetTier() {
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	const [ metas, setPostMeta ] = useEntityProp( 'postType', postType, 'meta' );
	return value => {
		setPostMeta( {
			...metas,
			[ META_NAME_FOR_POST_TIER_ID_SETTINGS ]: value,
		} );
	};
}

function TierSelector() {
	// TODO: figure out how to handle different currencies
	const products = useSelect( select =>
		select( membershipProductsStore ).getNewsletterTierProducts()
	)
		.filter( product => product.interval === '1 month' )
		.sort( ( p1, p2 ) => Number( p2.price ) - Number( p1.price ) );

	// Find the current tier meta
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	// Destructure the tierId from the meta (set tierId using the META_NAME_FOR_POST_TIER_ID_SETTINGS constant)
	const [ { [ META_NAME_FOR_POST_TIER_ID_SETTINGS ]: tierId } ] = useEntityProp(
		'postType',
		postType,
		'meta'
	);
	const setTier = useSetTier();

	// Tiers don't apply if less than 2 products (this is called here because
	// the hooks have to run before any early returns)
	if ( products.length < 2 ) {
		return;
	}

	return (
		<div className="jetpack-editor-post-tiers">
			<RadioControl
				label={ __( 'Choose Newsletter Tier', 'jetpack' ) }
				hideLabelFromVision={ true }
				selected={ Number( tierId ) }
				options={ products.map( product => {
					const label = product.title;
					const value = Number( product.id );
					return { label, value };
				} ) }
				onChange={ setTier }
			/>
		</div>
	);
}

export function NewsletterAccessRadioButtons( {
	accessLevel,
	hasTierPlans,
	stripeConnectUrl,
	postHasPaywallBlock: postHasPaywallBlock = false,
} ) {
	const isStripeConnected = stripeConnectUrl === null;
	const { totalSubscribers, paidSubscribers } = useSelect( select =>
		select( membershipProductsStore ).getSubscriberCounts()
	);

	// Paid subscribers can only be chosen once Stripe is connected and a tier exists.
	// Rather than hiding the option, we show it disabled alongside a link to set it up,
	// so creators discover that paid newsletters are available to them.
	const isPaidAvailable = isStripeConnected && hasTierPlans;
	const isPaidSelected = accessLevel === accessOptions.paid_subscribers.key;
	// Keep the option selectable when it is already the saved value, so a post set to
	// paid before Stripe was disconnected does not end up with nothing selected.
	const showPaidAsDisabled = ! isPaidAvailable && ! isPaidSelected;

	const setAccess = useSetAccess();
	const subscribersReach = getReachForAccessLevelKey( {
		accessLevel: accessOptions.subscribers.key,
		subscribers: totalSubscribers,
		paidSubscribers,
	} );
	const paidSubscribersReach = getReachForAccessLevelKey( {
		accessLevel: accessOptions.paid_subscribers.key,
		subscribers: totalSubscribers,
		paidSubscribers,
	} );

	const paidOptionLabel = `${ accessOptions.paid_subscribers.label } (${ formatNumberCompact(
		paidSubscribersReach
	) })`;
	const disabledPaidOptionId = useInstanceId(
		NewsletterAccessRadioButtons,
		'jetpack-newsletter-access-paid-subscribers-disabled'
	);

	return (
		<div className="jetpack-newsletter-access-radio-buttons">
			<RadioControl
				label={ __( 'Who can read this post?', 'jetpack' ) }
				onChange={ setAccess }
				options={ [
					...( ! postHasPaywallBlock
						? [
								{
									label: accessOptions.everybody.label,
									value: accessOptions.everybody.key,
								},
						  ]
						: [] ),
					{
						label: `${ accessOptions.subscribers.label } (${ formatNumberCompact(
							subscribersReach
						) })`,
						value: accessOptions.subscribers.key,
					},
					...( ! showPaidAsDisabled
						? [
								{
									label: paidOptionLabel,
									value: accessOptions.paid_subscribers.key,
								},
						  ]
						: [] ),
				] }
				selected={ accessLevel }
			/>
			{ showPaidAsDisabled && (
				<>
					<div className="components-radio-control__option jetpack-newsletter-access-radio-buttons__disabled-option">
						<input
							type="radio"
							className="components-radio-control__input"
							disabled
							checked={ false }
							readOnly
							id={ disabledPaidOptionId }
						/>
						<label className="components-radio-control__label" htmlFor={ disabledPaidOptionId }>
							{ paidOptionLabel }
						</label>
					</div>
					<ExternalLink openInNewTab href={ getPaidPlanLink( hasTierPlans ) }>
						{ __( 'Turn on paid subscribers', 'jetpack' ) }
					</ExternalLink>
				</>
			) }
			{ isPaidSelected && isPaidAvailable && <TierSelector></TierSelector> }
			<p className="jetpack-newsletter-access-radio-buttons__description">
				{ getAccessDescription( accessLevel, !! postHasPaywallBlock ) }
			</p>
		</div>
	);
}

export function NewsletterAccessDocumentSettings( { accessLevel } ) {
	const { hasTierPlans, stripeConnectUrl, isLoading, foundPaywallBlock } = useSelect( select => {
		const { getNewsletterTierProducts, getConnectUrl, isApiStateLoading } = select(
			'jetpack/membership-products'
		);
		const { getBlocks } = select( 'core/block-editor' );

		return {
			isLoading: isApiStateLoading(),
			stripeConnectUrl: getConnectUrl(),
			hasTierPlans: getNewsletterTierProducts()?.length !== 0,
			foundPaywallBlock: getBlocks().find( block => block.name === paywallBlockMetadata.name ),
		};
	} );

	const postVisibility = useSelect( select => select( editorStore ).getEditedPostVisibility() );
	const { selectBlock } = useDispatch( 'core/block-editor' );
	const { closeGeneralSidebar } = useDispatch( 'core/edit-post' );

	const isMobileViewport = useViewportMatch( 'medium', '<' );

	if ( isLoading ) {
		return (
			<Flex direction="column" align="center">
				<Spinner />
			</Flex>
		);
	}

	const _accessLevel = accessLevel ?? accessOptions.everybody.key;
	const accessLabel = accessOptions[ _accessLevel ]?.label;

	const showMisconfigurationWarning = getShowMisconfigurationWarning( postVisibility, accessLevel );

	return (
		<PostVisibilityCheck
			render={ ( { canEdit } ) => (
				<>
					{ foundPaywallBlock && (
						<>
							<div className="block-editor-block-card">
								<span className="block-editor-block-icon has-colors">
									<Icon icon={ paywallIcon } />
								</span>
								<div className="block-editor-block-card__content">
									<h2 className="block-editor-block-card__title">{ __( 'Paywall', 'jetpack' ) }</h2>
									<span className="block-editor-block-card__description">
										{ __(
											'The content below the paywall block is exclusive to the selected audience.',
											'jetpack'
										) }{ ' ' }
										<Button
											className="edit-post-paywall-toolbar-button"
											onClick={ () => {
												selectBlock( foundPaywallBlock.clientId );
												if ( isMobileViewport ) {
													closeGeneralSidebar();
												}
											} }
											variant={ 'link' }
										>
											{ __( 'Edit the block.', 'jetpack' ) }
										</Button>
									</span>
								</div>
							</div>
						</>
					) }
					<Flex direction="column">
						{ showMisconfigurationWarning && <MisconfigurationWarning /> }
						<FlexBlock direction="row" justify="flex-start">
							{ canEdit && (
								<NewsletterAccessRadioButtons
									accessLevel={ _accessLevel }
									stripeConnectUrl={ stripeConnectUrl }
									hasTierPlans={ hasTierPlans }
									postHasPaywallBlock={ foundPaywallBlock }
								/>
							) }

							{ /* Display the uneditable access level when the user doesn't have edit privileges*/ }
							{ ! canEdit && <span>{ accessLabel }</span> }
						</FlexBlock>
					</Flex>
				</>
			) }
		/>
	);
}

export function NewsletterEmailDocumentSettings() {
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	const { saveEditedEntityRecord } = useDispatch( coreDataStore );
	const [ postMeta, setPostMeta ] = useEntityProp( 'postType', postType, 'meta' );
	const postId = useEntityId( 'postType', postType );

	const postEmailSentState = useSelect(
		select => {
			const { getPostEmailSentState } = select( membershipProductsStore );
			return postId ? getPostEmailSentState( postId ) : null;
		},
		[ postId ]
	);

	const isAlreadySent = postEmailSentState?.email_sent_at != null;

	const toggleSendEmail = value => {
		const postMetaUpdate = {
			...postMeta,
			// Meta value is negated, "don't send", but toggle is truthy when enabled "send"
			[ META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS ]: value === 'post-only',
		};
		setPostMeta( postMetaUpdate );
		saveEditedEntityRecord( 'postType', postType, postId );
	};

	const isSendEmailEnabled = useSelect( select => {
		const meta = select( editorStore ).getEditedPostAttribute( 'meta' );
		// Meta value is negated, "don't send", but toggle is truthy when enabled "send"
		return meta?.[ META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS ] ? 'post-only' : 'post-and-email';
	} );

	if ( isAlreadySent ) {
		return null;
	}

	return (
		<PostVisibilityCheck
			render={ ( { canEdit } ) => {
				return (
					<ToggleGroupControl
						value={ isSendEmailEnabled }
						disabled={ isPostPublished || ! canEdit }
						onChange={ toggleSendEmail }
						isBlock
						label={ __( 'Send as email to subscribers?', 'jetpack' ) }
						hideLabelFromVision={ true }
						className="jetpack-subscribe-email-document-setting"
						__nextHasNoMarginBottom={ true }
						__next40pxDefaultSize={ true }
					>
						<ToggleGroupControlOption
							label={ __( 'Post & email', 'jetpack' ) }
							value="post-and-email"
						/>
						<ToggleGroupControlOption label={ __( 'Post only', 'jetpack' ) } value="post-only" />
					</ToggleGroupControl>
				);
			} }
		/>
	);
}
