import { formatNumberCompact } from '@automattic/number-formatters';
import {
	BaseControl,
	Flex,
	FlexBlock,
	RadioControl,
	Spinner,
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useEntityId, useEntityProp, store as coreDataStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { PostVisibilityCheck, store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { Link, Notice } from '@wordpress/ui';
import clsx from 'clsx';
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

/**
 * A single audience option, rendered with Gutenberg's own RadioControl classes so it
 * looks identical to a stock radio group.
 *
 * The group is built by hand rather than with RadioControl because an unavailable
 * option has to stay visible in its natural position — "Everyone" sits above the
 * options that remain selectable, which is a place RadioControl gives no way to reach.
 *
 * Unavailable options use aria-disabled rather than the native disabled attribute: a
 * disabled input leaves the tab order and is skipped by screen readers, which would
 * hide the option from exactly the people its explanation is there to inform. They are
 * also left out of the shared group name, so arrow-key navigation — which selects as it
 * moves — cannot land on one and choose it.
 *
 * @param {object}   props               - Component props.
 * @param {string}   props.id            - Unique id tying the input to its label.
 * @param {string}   props.groupName     - Shared name for the selectable options.
 * @param {string}   props.value         - Access level key this option sets.
 * @param {string}   props.label         - Visible label.
 * @param {boolean}  props.checked       - Whether this option is the current value.
 * @param {boolean}  props.disabled      - Whether this option cannot be chosen.
 * @param {string}   [props.describedBy] - Id of the element explaining why it is unavailable.
 * @param {Function} props.onChange      - Called with the new access level key.
 * @return {import('react').ReactElement} The option.
 */
function AccessOption( { id, groupName, value, label, checked, disabled, describedBy, onChange } ) {
	return (
		<div
			className={ clsx( 'components-radio-control__option', {
				'jetpack-newsletter-access-radio-buttons__disabled-option': disabled,
			} ) }
		>
			<input
				type="radio"
				className="components-radio-control__input"
				id={ id }
				name={ disabled ? undefined : groupName }
				value={ value }
				checked={ checked }
				aria-disabled={ disabled || undefined }
				aria-describedby={ describedBy }
				readOnly={ disabled }
				onChange={ disabled ? undefined : event => onChange( event.target.value ) }
				onClick={ disabled ? event => event.preventDefault() : undefined }
				onKeyDown={
					disabled
						? event => {
								if ( event.key === ' ' ) {
									event.preventDefault();
								}
						  }
						: undefined
				}
			/>
			<label className="components-radio-control__label" htmlFor={ id }>
				{ label }
			</label>
		</div>
	);
}

export function NewsletterAccessRadioButtons( {
	accessLevel,
	hasTierPlans,
	stripeConnectUrl,
	postHasPaywallBlock: postHasPaywallBlock = false,
	explainPaywallConstraint = true,
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

	// A paywall block splits the post, so "the whole post is public" stops being an
	// option it can express. The option stays visible and disabled — the same treatment
	// paid subscribers gets — with a notice saying why, rather than the panel silently
	// changing shape. The saved-value guard is the same as above: the paywall block
	// moves the post off "everybody" when it is inserted, but until that lands we must
	// not leave the group with nothing selected.
	const isEverybodySelected = accessLevel === accessOptions.everybody.key;
	const showEverybodyAsDisabled = !! postHasPaywallBlock && ! isEverybodySelected;

	// The paywall block's own inspector opts out: it sits directly under Gutenberg's
	// block card, which already says what a paywall does, so the notice repeats the
	// heading above it. Both the notice and the option's aria-describedby derive from
	// this one flag — gating only the notice would leave the option pointing at an id
	// that is no longer in the DOM, which reads as no description at all.
	const showPaywallNotice = showEverybodyAsDisabled && explainPaywallConstraint;

	const setAccess = useSetAccess();
	// The count beside each option is the size of the audience that can read it, which
	// is what distinguishes the options from one another. postHasPaywallBlock is
	// deliberately not forwarded here: it would switch the paid count to the email
	// reach, making both options report the same total on a post with a paywall block.
	// Who receives the email is stated in getAccessDescription instead.
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

	const instanceId = useInstanceId( NewsletterAccessRadioButtons, 'jetpack-newsletter-access' );
	const groupName = `${ instanceId }-group`;
	const paywallNoticeId = `${ instanceId }-paywall-notice`;
	const setupLinkId = `${ instanceId }-paid-setup-link`;

	const options = [
		{
			value: accessOptions.everybody.key,
			label: accessOptions.everybody.label,
			disabled: showEverybodyAsDisabled,
			describedBy: showPaywallNotice ? paywallNoticeId : undefined,
		},
		{
			value: accessOptions.subscribers.key,
			label: `${ accessOptions.subscribers.label } (${ formatNumberCompact( subscribersReach ) })`,
		},
		{
			value: accessOptions.paid_subscribers.key,
			label: `${ accessOptions.paid_subscribers.label } (${ formatNumberCompact(
				paidSubscribersReach
			) })`,
			disabled: showPaidAsDisabled,
			describedBy: showPaidAsDisabled ? setupLinkId : undefined,
		},
	];

	return (
		<div className="jetpack-newsletter-access-radio-buttons">
			{ showPaywallNotice && (
				// icon={ null } matches the mockup, which shows the notice without the
				// intent icon @wordpress/ui would otherwise render for "info".
				<Notice.Root intent="info" icon={ null } id={ paywallNoticeId }>
					<Notice.Title>{ __( 'Paywall active', 'jetpack' ) }</Notice.Title>
					<Notice.Description>
						{ __(
							'Choose who can read the full post. Everyone can still read the content above the paywall.',
							'jetpack'
						) }
					</Notice.Description>
				</Notice.Root>
			) }
			<fieldset role="radiogroup" className="components-radio-control">
				<BaseControl.VisualLabel as="legend">
					{ __( 'Who can read this post?', 'jetpack' ) }
				</BaseControl.VisualLabel>
				<div className="components-radio-control__group-wrapper">
					{ options.map( option => (
						<AccessOption
							key={ option.value }
							id={ `${ instanceId }-${ option.value }` }
							groupName={ groupName }
							value={ option.value }
							label={ option.label }
							checked={ ! option.disabled && accessLevel === option.value }
							disabled={ !! option.disabled }
							describedBy={ option.describedBy }
							onChange={ setAccess }
						/>
					) ) }
				</div>
			</fieldset>
			{ showPaidAsDisabled && (
				<Link id={ setupLinkId } openInNewTab href={ getPaidPlanLink( hasTierPlans ) }>
					{ __( 'Turn on paid subscribers', 'jetpack' ) }
				</Link>
			) }
			{ isPaidSelected && isPaidAvailable && <TierSelector></TierSelector> }
			<p className="jetpack-newsletter-access-radio-buttons__description">
				{ getAccessDescription( accessLevel, !! postHasPaywallBlock ) }
			</p>
		</div>
	);
}

export function NewsletterAccessDocumentSettings( { accessLevel } ) {
	const { hasTierPlans, stripeConnectUrl, isLoading, postHasPaywallBlock } = useSelect( select => {
		const { getNewsletterTierProducts, getConnectUrl, isApiStateLoading } = select(
			'jetpack/membership-products'
		);
		const { getBlocks } = select( 'core/block-editor' );

		return {
			isLoading: isApiStateLoading(),
			stripeConnectUrl: getConnectUrl(),
			hasTierPlans: getNewsletterTierProducts()?.length !== 0,
			postHasPaywallBlock: getBlocks().some( block => block.name === paywallBlockMetadata.name ),
		};
	} );

	const postVisibility = useSelect( select => select( editorStore ).getEditedPostVisibility() );

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
				<Flex direction="column">
					{ showMisconfigurationWarning && <MisconfigurationWarning /> }
					<FlexBlock direction="row" justify="flex-start">
						{ canEdit && (
							<NewsletterAccessRadioButtons
								accessLevel={ _accessLevel }
								stripeConnectUrl={ stripeConnectUrl }
								hasTierPlans={ hasTierPlans }
								postHasPaywallBlock={ postHasPaywallBlock }
							/>
						) }

						{ /* Display the uneditable access level when the user doesn't have edit privileges*/ }
						{ ! canEdit && <span>{ accessLabel }</span> }
					</FlexBlock>
				</Flex>
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
