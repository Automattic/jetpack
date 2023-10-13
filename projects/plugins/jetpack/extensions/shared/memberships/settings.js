import {
	Flex,
	FlexBlock,
	PanelRow,
	VisuallyHidden,
	Spinner,
	Button,
	RadioControl,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useEntityProp } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { PostVisibilityCheck, store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import { useState } from 'react';
import { icon as paywallIcon, blockName as paywallBlockName } from '../../blocks/paywall';
import { store as membershipProductsStore } from '../../store/membership-products';
import './settings.scss';
import PlansSetupDialog from '../components/plans-setup-dialog';
import {
	accessOptions,
	META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS,
	META_NAME_FOR_POST_TIER_ID_SETTINGS,
} from './constants';
import { getShowMisconfigurationWarning, MisconfigurationWarning } from './utils';

export function Link( { href, children } ) {
	return (
		<a target="_blank" rel="noopener noreferrer" href={ href } className="jetpack-newsletter-link">
			{ children }
		</a>
	);
}

export function getReachForAccessLevelKey( accessLevelKey, emailSubscribers, paidSubscribers ) {
	switch ( accessOptions[ accessLevelKey ].key ) {
		case accessOptions.everybody.key:
			return emailSubscribers || 0;
		case accessOptions.subscribers.key:
			return emailSubscribers || 0;
		case accessOptions.paid_subscribers.key:
			return paidSubscribers || 0;
		default:
			return 0;
	}
}

export function useSetAccess() {
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	const [ , setPostMeta ] = useEntityProp( 'postType', postType, 'meta' );

	return value => {
		setPostMeta( {
			[ META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS ]: value,
		} );
	};
}

export function useSetTier() {
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	const [ , setPostMeta ] = useEntityProp( 'postType', postType, 'meta' );

	return value => {
		setPostMeta( {
			[ META_NAME_FOR_POST_TIER_ID_SETTINGS ]: value,
		} );
	};
}

function TierSelector() {
	// TODO: figure out how to handle different currencies
	const products = useSelect( select => select( membershipProductsStore ).getProducts() )
		.filter( product => product.subscribe_as_site_subscriber && product.interval === '1 month' )
		.sort( ( p1, p2 ) => Number( p2.price ) - Number( p1.price ) );

	// Find the current tier meta
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	// Destructure the tierId from the meta (set tierId using the META_NAME_FOR_POST_TIER_ID_SETTINGS constant)
	let [ { [ META_NAME_FOR_POST_TIER_ID_SETTINGS ]: tierId } ] = useEntityProp(
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

	// if no tier are selected, we select the lowest one
	if ( ! tierId ) {
		tierId = products[ products.length - 1 ].id;
		setTimeout( () => setTier( tierId ) );
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
	hasNewsletterPlans,
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

	return (
		<fieldset className="editor-post-visibility__fieldset">
			<VisuallyHidden as="legend">{ __( 'Audience', 'jetpack' ) } </VisuallyHidden>
			<RadioControl
				onChange={ value => {
					if (
						accessOptions.paid_subscribers.key === value &&
						( stripeConnectUrl || ! hasNewsletterPlans )
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
						label: `${ accessOptions.subscribers.label } (${ getReachForAccessLevelKey(
							accessOptions.subscribers.key,
							emailSubscribers,
							paidSubscribers
						) })`,
						value: accessOptions.subscribers.key,
					},
					{
						label: `${ accessOptions.paid_subscribers.label } (${ getReachForAccessLevelKey(
							accessOptions.paid_subscribers.key,
							emailSubscribers,
							paidSubscribers
						) })`,
						value: accessOptions.paid_subscribers.key,
					},
				] }
				selected={ accessLevel }
			/>
			{ accessLevel === accessOptions.paid_subscribers.key &&
				isStripeConnected &&
				hasNewsletterPlans && <TierSelector></TierSelector> }

			{ isEditorPanel && (
				<PlansSetupDialog closeDialog={ closeDialog } showDialog={ showDialog } />
			) }
		</fieldset>
	);
}

export function NewsletterAccessDocumentSettings( { accessLevel } ) {
	const { hasNewsletterPlans, stripeConnectUrl, isLoading, foundPaywallBlock } = useSelect(
		select => {
			const { getNewsletterProducts, getConnectUrl, isApiStateLoading } = select(
				'jetpack/membership-products'
			);
			const { getBlocks } = select( 'core/block-editor' );

			return {
				isLoading: isApiStateLoading(),
				stripeConnectUrl: getConnectUrl(),
				hasNewsletterPlans: getNewsletterProducts()?.length !== 0,
				foundPaywallBlock: getBlocks().find( block => block.name === paywallBlockName ),
			};
		}
	);

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
					<PanelRow className="edit-post-post-visibility">
						<Flex direction="column">
							{ showMisconfigurationWarning && <MisconfigurationWarning /> }
							<FlexBlock direction="row" justify="flex-start">
								{ canEdit && (
									<div className="editor-post-visibility">
										<NewsletterAccessRadioButtons
											isEditorPanel={ true }
											accessLevel={ _accessLevel }
											stripeConnectUrl={ stripeConnectUrl }
											hasNewsletterPlans={ hasNewsletterPlans }
											postHasPaywallBlock={ foundPaywallBlock }
										/>
									</div>
								) }

								{ /* Display the uneditable access level when the user doesn't have edit privileges*/ }
								{ ! canEdit && <span>{ accessLabel }</span> }
							</FlexBlock>
						</Flex>
					</PanelRow>
				</>
			) }
		/>
	);
}

export function NewsletterAccessPrePublishSettings( { accessLevel } ) {
	const { isLoading, postHasPaywallBlock } = useSelect( select => {
		const { getNewsletterProducts, getConnectUrl, isApiStateLoading } = select(
			'jetpack/membership-products'
		);
		const { getBlocks } = select( 'core/block-editor' );

		return {
			isLoading: isApiStateLoading(),
			stripeConnectUrl: getConnectUrl(),
			hasNewsletterPlans: getNewsletterProducts()?.length !== 0,
			postHasPaywallBlock: getBlocks().some( block => block.name === paywallBlockName ),
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

	const getText = () => {
		if ( _accessLevel === accessOptions.paid_subscribers.key ) {
			if ( ! postHasPaywallBlock ) {
				return __( 'This post will be sent to paid subscribers only.', 'jetpack' );
			}
		}
		return __( 'This post will be sent to all subscribers.', 'jetpack' );
	};

	const showMisconfigurationWarning = getShowMisconfigurationWarning( postVisibility, accessLevel );

	return (
		<PostVisibilityCheck
			render={ () => (
				<PanelRow className="edit-post-post-visibility">
					<Flex direction="column">
						{ showMisconfigurationWarning && <MisconfigurationWarning /> }
						<p>{ getText() }</p>
					</Flex>
				</PanelRow>
			) }
		/>
	);
}
