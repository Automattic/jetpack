import { numberFormat } from '@automattic/jetpack-components';
import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import {
	Button,
	Flex,
	FlexBlock,
	RadioControl,
	Spinner,
	VisuallyHidden,
	// eslint-disable-next-line wpcalypso/no-unsafe-wp-apis
	__experimentalToggleGroupControl as ToggleGroupControl,
	// eslint-disable-next-line wpcalypso/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useEntityId, useEntityProp, store as coreDataStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { PostVisibilityCheck, store as editorStore } from '@wordpress/editor';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
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

export function Link( { href, children } ) {
	return (
		<a target="_blank" rel="noopener noreferrer" href={ href } className="jetpack-newsletter-link">
			{ children }
		</a>
	);
}

export function getReachForAccessLevelKey( {
	accessLevel,
	emailSubscribers,
	paidSubscribers,
	postHasPaywallBlock = false,
} ) {
	emailSubscribers = emailSubscribers ?? 0;
	paidSubscribers = paidSubscribers ?? 0;

	switch ( accessOptions[ accessLevel ]?.key ) {
		case accessOptions.everybody.key:
			return emailSubscribers;
		case accessOptions.subscribers.key:
			return emailSubscribers;
		case accessOptions.paid_subscribers.key:
			return postHasPaywallBlock ? emailSubscribers : paidSubscribers;
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
	const { emailSubscribers, paidSubscribers } = useSelect( select =>
		select( membershipProductsStore ).getSubscriberCounts()
	);
	const [ showDialog, setShowDialog ] = useState( false );
	const closeDialog = () => setShowDialog( false );

	const setAccess = useSetAccess();
	const subscribersReach = getReachForAccessLevelKey( {
		accessLevel: accessOptions.subscribers.key,
		emailSubscribers,
		paidSubscribers,
	} );
	const paidSubscribersReach = getReachForAccessLevelKey( {
		accessLevel: accessOptions.paid_subscribers.key,
		emailSubscribers,
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
						label: `${ accessOptions.subscribers.label } (${ numberFormat( subscribersReach, {
							notation: 'compact',
							maximumFractionDigits: 1,
						} ) })`,
						value: accessOptions.subscribers.key,
					},
					{
						label: `${ accessOptions.paid_subscribers.label } (${ numberFormat(
							paidSubscribersReach,
							{
								notation: 'compact',
								maximumFractionDigits: 1,
							}
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
	const { saveEditedEntityRecord } = useDispatch( coreDataStore );
	const [ postMeta, setPostMeta ] = useEntityProp( 'postType', postType, 'meta' );
	const postId = useEntityId( 'postType', postType );
	const toggleSendEmail = value => {
		const postMetaUpdate = {
			...postMeta,
			// Meta value is negated, "don't send", but toggle is truthy when enabled "send"
			[ META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS ]: ! value,
		};
		setPostMeta( postMetaUpdate );
		saveEditedEntityRecord( 'postType', postType, postId );
	};

	const isSendEmailEnabled = useSelect( select => {
		const meta = select( editorStore ).getEditedPostAttribute( 'meta' );
		// Meta value is negated, "don't send", but toggle is truthy when enabled "send"
		return ! meta?.[ META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS ];
	} );

	return (
		<PostVisibilityCheck
			render={ ( { canEdit } ) => {
				return (
					<ToggleGroupControl
						value={ isSendEmailEnabled }
						disabled={ isPostPublished || ! canEdit }
						onChange={ toggleSendEmail }
						isBlock
					>
						<ToggleGroupControlOption label={ __( 'Post & email', 'jetpack' ) } value={ true } />
						<ToggleGroupControlOption label={ __( 'Post only', 'jetpack' ) } value={ false } />
					</ToggleGroupControl>
				);
			} }
		/>
	);
}
