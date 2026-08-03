import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import { formatNumberCompact } from '@automattic/number-formatters';
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	Flex,
	FlexBlock,
	RadioControl,
	Spinner,
	VisuallyHidden,
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useEntityId, useEntityProp, store as coreDataStore } from '@wordpress/core-data';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { PostVisibilityCheck, store as editorStore } from '@wordpress/editor';
import { useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import paywallBlockMetadata from '../../blocks/paywall/block.json';
import { store as membershipProductsStore } from '../../store/membership-products';
import './settings.scss';
import PlansSetupDialog from '../components/plans-setup-dialog';
import {
	accessOptions,
	META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS,
	META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS,
	META_NAME_FOR_POST_TIER_ID_SETTINGS,
} from './constants';
import { getShowMisconfigurationWarning, MisconfigurationWarning } from './utils';

const paywallIcon = getBlockIconComponent( paywallBlockMetadata );

// Keeps repeated failures from stacking duplicate snackbars.
const WRITE_FAILED_NOTICE_ID = 'jetpack-newsletter-email-setting-write-failed';

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
	isEditorPanel = false,
	postHasPaywallBlock: postHasPaywallBlock = false,
} ) {
	const isStripeConnected = stripeConnectUrl === null;
	const { totalSubscribers, paidSubscribers } = useSelect( select =>
		select( membershipProductsStore ).getSubscriberCounts()
	);
	const [ showDialog, setShowDialog ] = useState( false );
	const closeDialog = () => setShowDialog( false );

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

	return (
		<fieldset className="jetpack-newsletter-access-radio-buttons">
			<VisuallyHidden as="legend">{ __( 'Access', 'jetpack' ) } </VisuallyHidden>
			<RadioControl
				onChange={ value => {
					if (
						accessOptions.paid_subscribers.key === value &&
						( stripeConnectUrl || ! hasTierPlans )
					) {
						setShowDialog( true );
						return;
					}
					setAccess( value );
				} }
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
					{
						label: `${ accessOptions.paid_subscribers.label } (${ formatNumberCompact(
							paidSubscribersReach
						) })`,
						value: accessOptions.paid_subscribers.key,
					},
				] }
				selected={ accessLevel }
			/>
			{ accessLevel === accessOptions.paid_subscribers.key && isStripeConnected && hasTierPlans && (
				<TierSelector></TierSelector>
			) }

			{ isEditorPanel && (
				<PlansSetupDialog closeDialog={ closeDialog } showDialog={ showDialog } />
			) }
		</fieldset>
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
									isEditorPanel={ true }
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
	const { receiveEntityRecords, editEntityRecord } = useDispatch( coreDataStore );
	const { createErrorNotice } = useDispatch( noticesStore );
	const registry = useRegistry();
	const postId = useEntityId( 'postType', postType );
	const [ pendingValue, setPendingValue ] = useState( null );
	const requestedValueRef = useRef( null );
	const isWritingRef = useRef( false );
	const postTypeBaseUrl = useSelect(
		select => select( coreDataStore ).getEntityConfig( 'postType', postType )?.baseURL,
		[ postType ]
	);

	const postEmailSentState = useSelect(
		select => {
			const { getPostEmailSentState } = select( membershipProductsStore );
			return postId ? getPostEmailSentState( postId ) : null;
		},
		[ postId ]
	);

	const isAlreadySent = postEmailSentState?.email_sent_at != null;

	const noticeWriteFailed = error => {
		if ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Could not save the newsletter email setting', error );
		}
		createErrorNotice( __( 'The newsletter setting could not be saved.', 'jetpack' ), {
			type: 'snackbar',
			id: WRITE_FAILED_NOTICE_ID,
		} );
	};

	// `getEditedPostAttribute` merges staged meta over the persisted record, so an edit staged by
	// another panel keeps shadowing the key we just wrote. Retarget it, but never stage one that
	// isn't already there — that is what dirties the post in the first place.
	const realignStagedMeta = dontEmail => {
		const stagedMeta = registry
			.select( coreDataStore )
			.getEntityRecordEdits( 'postType', postType, postId )?.meta;

		if ( ! stagedMeta || stagedMeta[ META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS ] === dontEmail ) {
			return;
		}

		editEntityRecord(
			'postType',
			postType,
			postId,
			{ meta: { [ META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS ]: dontEmail } },
			{ undoIgnore: true }
		);
	};

	// Bandaid: a staged meta edit sticks the post dirty under real-time collaboration, and the
	// entity save rejects auto-drafts. Write the one key on its own instead.
	const writeRequestedValue = async () => {
		isWritingRef.current = true;
		try {
			// One write at a time, but loop so a click made mid-write is applied, not dropped.
			let written;
			while ( requestedValueRef.current !== written ) {
				written = requestedValueRef.current;
				// Meta value is negated, "don't send", but toggle is truthy when enabled "send"
				const dontEmail = written === 'post-only';
				// Update responses already come back in the edit context.
				const updatedPost = await apiFetch( {
					path: `${ postTypeBaseUrl }/${ postId }`,
					method: 'POST',
					data: { meta: { [ META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS ]: dontEmail } },
				} );
				receiveEntityRecords( 'postType', postType, updatedPost, undefined, true );
				realignStagedMeta( dontEmail );
			}
		} catch ( error ) {
			noticeWriteFailed( error );
		} finally {
			isWritingRef.current = false;
			requestedValueRef.current = null;
			setPendingValue( null );
		}
	};

	const toggleSendEmail = value => {
		if ( ! postId || ! postTypeBaseUrl ) {
			noticeWriteFailed();
			return;
		}
		requestedValueRef.current = value;
		setPendingValue( value );
		if ( ! isWritingRef.current ) {
			writeRequestedValue();
		}
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
				// ToggleGroupControl ignores `disabled`; only its options honour it. Writes are
				// serialised in the handler instead — disabling the option the user just activated
				// would drop their focus for the length of the request.
				const isLocked = isPostPublished || ! canEdit;

				return (
					<ToggleGroupControl
						value={ pendingValue ?? isSendEmailEnabled }
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
							disabled={ isLocked }
						/>
						<ToggleGroupControlOption
							label={ __( 'Post only', 'jetpack' ) }
							value="post-only"
							disabled={ isLocked }
						/>
					</ToggleGroupControl>
				);
			} }
		/>
	);
}
