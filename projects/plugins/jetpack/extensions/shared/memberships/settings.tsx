import { formatNumberCompact } from '@automattic/number-formatters';
import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	BaseControl,
	Flex,
	FlexBlock,
	RadioControl,
	Spinner,
	ToggleControl,
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
import { getAccessDescription } from './newsletter-copy';
import {
	getPaidAccessState,
	getPaidPlanLink,
	getShowMisconfigurationWarning,
	MisconfigurationWarning,
} from './utils';
import type { ReactElement } from 'react';

interface ReachForAccessLevelKeyArgs {
	accessLevel: string;
	subscribers?: number;
	paidSubscribers?: number;
	postHasPaywallBlock?: boolean;
}

export function getReachForAccessLevelKey( {
	accessLevel,
	subscribers, // This can be either total subscribers or email subscribers depending on the view where this is used.
	paidSubscribers,
	postHasPaywallBlock = false,
}: ReachForAccessLevelKeyArgs ): number {
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

export function useSetAccess(): ( value: string ) => void {
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

/**
 * Returns a setter for the post's newsletter tier. `null` clears it, sending to all paid subscribers.
 *
 * @return {Function} Tier setter.
 */
export function useSetTier(): ( value: number | string | null ) => void {
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	const [ metas, setPostMeta ] = useEntityProp( 'postType', postType, 'meta' );
	return value => {
		setPostMeta( {
			...metas,
			[ META_NAME_FOR_POST_TIER_ID_SETTINGS ]: value,
		} );
	};
}

interface NewsletterTierProduct {
	id: number | string;
	title: string;
	price: number | string;
	interval: string;
}

const ALL_TIERS_VALUE = 'all';

/**
 * Appends a subscriber count to a label when one is available.
 *
 * @param {string} label - Option label.
 * @param {number} count - Subscriber count, if known.
 * @return {string} The label, with the count in parentheses when known.
 */
function withCount( label: string, count?: number | null ): string {
	return typeof count === 'number' ? `${ label } (${ formatNumberCompact( count ) })` : label;
}

function TierSelector() {
	// TODO: figure out how to handle different currencies
	const { tierProducts, countsLoaded, paidSubscribers, paidSubscribersByTier } = useSelect(
		select => {
			const store = select( membershipProductsStore );
			const counts = store.getSubscriberCounts();
			return {
				tierProducts: store.getNewsletterTierProducts() as NewsletterTierProduct[],
				countsLoaded: counts.paidSubscribers != null,
				paidSubscribers: ( counts.paidNewsletterSubscribers ?? counts.paidSubscribers ) as
					number | null,
				paidSubscribersByTier: counts.paidSubscribersByTier as Record< string, number > | null,
			};
		},
		[]
	);
	const products = tierProducts
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

	// With no tiers there is nothing to narrow down to.
	if ( products.length < 1 ) {
		return null;
	}

	// Hide a lone tier that have same subscribers count as "All"; show it if counts differ.
	if ( products.length === 1 && ! tierId ) {
		const tierCount = paidSubscribersByTier?.[ String( products[ 0 ].id ) ];
		if ( ! countsLoaded || tierCount === paidSubscribers ) {
			return null;
		}
	}

	const options = [
		{
			label: withCount( __( 'All paid subscribers', 'jetpack' ), paidSubscribers ),
			value: ALL_TIERS_VALUE,
		},
		...products.map( product => ( {
			label: withCount( product.title, paidSubscribersByTier?.[ String( product.id ) ] ),
			value: String( product.id ),
		} ) ),
	];

	// A post can still point at a tier that is no longer offered; keep it visible
	// rather than showing "All", since emails are still limited to that tier.
	if ( tierId && ! products.some( product => String( product.id ) === String( tierId ) ) ) {
		options.push( {
			label: __( 'Deleted tier', 'jetpack' ),
			value: String( tierId ),
		} );
	}

	return (
		<div className="jetpack-editor-post-tiers">
			<RadioControl
				label={ __( 'Choose Newsletter Tier', 'jetpack' ) }
				hideLabelFromVision={ true }
				selected={ tierId ? String( tierId ) : ALL_TIERS_VALUE }
				options={ options }
				onChange={ value => setTier( value === ALL_TIERS_VALUE ? null : Number( value ) ) }
			/>
		</div>
	);
}

interface AccessOptionProps {
	id: string;
	groupName: string;
	value: string;
	label: string;
	checked: boolean;
	disabled: boolean;
	describedBy?: string;
	onChange: ( value: string ) => void;
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
 * @return {ReactElement} The option.
 */
function AccessOption( {
	id,
	groupName,
	value,
	label,
	checked,
	disabled,
	describedBy,
	onChange,
}: AccessOptionProps ): ReactElement {
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

interface NewsletterAccessRadioButtonsProps {
	accessLevel: string;
	hasTierPlans: boolean;
	stripeConnectUrl: string | null;
	postHasPaywallBlock?: boolean;
	explainPaywallConstraint?: boolean;
}

export function NewsletterAccessRadioButtons( {
	accessLevel,
	hasTierPlans,
	stripeConnectUrl,
	postHasPaywallBlock = false,
	explainPaywallConstraint = true,
}: NewsletterAccessRadioButtonsProps ) {
	const { totalSubscribers, paidSubscribers, paidNewsletterSubscribers } = useSelect( select =>
		select( membershipProductsStore ).getSubscriberCounts()
	);
	const isLoading = useSelect( select => select( membershipProductsStore ).isApiStateLoading() );

	// Show paid disabled with a setup link beside it, so creators discover paid newsletters.
	const { isPaidAvailable, showPaidAsDisabled, showSetupPrompt } = getPaidAccessState( {
		stripeConnectUrl,
		hasTierPlans,
		isLoading,
		accessLevel,
	} );
	const isPaidSelected = accessLevel === accessOptions.paid_subscribers.key;

	// A paywall block splits the post, so "the whole post is public" stops being an
	// option it can express. The option stays visible and disabled — the same treatment
	// paid subscribers gets — with a notice saying why, rather than the panel silently
	// changing shape. As with paid in getPaidAccessState, the saved value stays selectable:
	// the paywall block moves the post off "everybody" when it is inserted, but until that
	// lands we must not leave the group with nothing selected.
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
	// Who receives the email is stated in the Newsletter overview instead.
	// Counts are null until loaded; leave them off the labels rather than showing 0.
	const subscribersReach =
		totalSubscribers == null
			? null
			: getReachForAccessLevelKey( {
					accessLevel: accessOptions.subscribers.key,
					subscribers: totalSubscribers,
					paidSubscribers,
				} );
	const paidCount = paidNewsletterSubscribers ?? paidSubscribers;
	const paidSubscribersReach =
		paidCount == null
			? null
			: getReachForAccessLevelKey( {
					accessLevel: accessOptions.paid_subscribers.key,
					subscribers: totalSubscribers,
					paidSubscribers: paidCount,
				} );

	const instanceId = useInstanceId( NewsletterAccessRadioButtons, 'jetpack-newsletter-access' );
	const groupName = `${ instanceId }-group`;
	const paywallNoticeId = `${ instanceId }-paywall-notice`;
	const setupLinkId = `${ instanceId }-paid-setup-link`;

	const options: Array< {
		value: string;
		label: string;
		disabled?: boolean;
		describedBy?: string;
	} > = [
		{
			value: accessOptions.everybody.key,
			label: accessOptions.everybody.label,
			disabled: showEverybodyAsDisabled,
			describedBy: showPaywallNotice ? paywallNoticeId : undefined,
		},
		{
			value: accessOptions.subscribers.key,
			label: withCount( accessOptions.subscribers.label, subscribersReach ),
		},
		{
			value: accessOptions.paid_subscribers.key,
			label: withCount( accessOptions.paid_subscribers.label, paidSubscribersReach ),
			disabled: showPaidAsDisabled,
			describedBy: showSetupPrompt ? setupLinkId : undefined,
		},
	];

	return (
		<div className="jetpack-newsletter-access-radio-buttons">
			{ showPaywallNotice && (
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
					{ __( 'Who can read this on your site?', 'jetpack' ) }
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
			{ showSetupPrompt && (
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

export function NewsletterAccessDocumentSettings( { accessLevel }: { accessLevel?: string } ) {
	const { hasTierPlans, stripeConnectUrl, isLoading, postHasPaywallBlock } = useSelect( select => {
		const { getNewsletterTierProducts, getConnectUrl, isApiStateLoading } =
			select( membershipProductsStore );
		const { getBlocks } = select( blockEditorStore );

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
			render={ ( { canEdit }: { canEdit: boolean } ) => (
				<Flex direction="column">
					{ showMisconfigurationWarning && <MisconfigurationWarning /> }
					<FlexBlock>
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

/**
 * Turn emailing the current post to subscribers on or off, saving the change right away.
 *
 * @return {Function} Setter taking whether the post should be emailed.
 */
export function useSetSendEmail(): ( sendEmail: boolean ) => void {
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	const { saveEditedEntityRecord } = useDispatch( coreDataStore );
	const [ postMeta, setPostMeta ] = useEntityProp( 'postType', postType, 'meta' );
	const postId = useEntityId( 'postType', postType );

	return sendEmail => {
		setPostMeta( {
			...postMeta,
			// Meta value is negated, "don't send", but callers pass the truthy "send".
			[ META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS ]: ! sendEmail,
		} );
		saveEditedEntityRecord( 'postType', postType, postId );
	};
}

export function NewsletterEmailDocumentSettings() {
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	const postId = useEntityId( 'postType', postType );
	const setSendEmail = useSetSendEmail();

	const postEmailSentState = useSelect(
		select => {
			const { getPostEmailSentState } = select( membershipProductsStore );
			return postId ? getPostEmailSentState( postId ) : null;
		},
		[ postId ]
	);

	const isAlreadySent = postEmailSentState?.email_sent_at != null;

	const isSendEmailEnabled = useSelect( select => {
		const meta = select( editorStore ).getEditedPostAttribute( 'meta' );
		return ! meta?.[ META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS ];
	} );

	if ( isAlreadySent ) {
		return null;
	}

	return (
		<PostVisibilityCheck
			render={ ( { canEdit }: { canEdit: boolean } ) => {
				return (
					<ToggleControl
						className="jetpack-subscribe-email-document-setting"
						checked={ isSendEmailEnabled }
						disabled={ isPostPublished || ! canEdit }
						label={ __( 'Send this post to subscribers', 'jetpack' ) }
						onChange={ setSendEmail }
					/>
				);
			} }
		/>
	);
}
