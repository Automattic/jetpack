import { Flex, FlexBlock, PanelRow, VisuallyHidden, Spinner, Button } from '@wordpress/components';
import { useInstanceId, useViewportMatch } from '@wordpress/compose';
import { useEntityProp } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { PostVisibilityCheck, store as editorStore } from '@wordpress/editor';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import { icon as paywallIcon, blockName as paywallBlockName } from '../../blocks/paywall';
import { store as membershipProductsStore } from '../../store/membership-products';
import './settings.scss';
import {
	accessOptions,
	META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS,
	META_NAME_FOR_POST_TIER_ID_SETTINGS,
} from './constants';
import { getPaidPlanLink, getShowMisconfigurationWarning, MisconfigurationWarning } from './utils';

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

function NewsletterAccessSetupNudge( { stripeConnectUrl, isStripeConnected, hasNewsletterPlans } ) {
	const paidLink = getPaidPlanLink( hasNewsletterPlans );

	if ( ! hasNewsletterPlans && ! isStripeConnected ) {
		return (
			<div className="editor-post-visibility__info">
				{ createInterpolateElement(
					__(
						"You'll need to connect <stripeAccountLink>Stripe</stripeAccountLink> and add a <paidPlanLink>paid plan</paidPlanLink> to collect payments.",
						'jetpack'
					),
					{
						stripeAccountLink: <Link href={ stripeConnectUrl } />,
						paidPlanLink: <Link href={ paidLink } />,
					}
				) }
			</div>
		);
	}

	if ( ! hasNewsletterPlans ) {
		return (
			<div className="editor-post-visibility__info">
				{ createInterpolateElement(
					__(
						'<paidPlanLink>Set up a paid subscription plan</paidPlanLink> to enable this option.',
						'jetpack'
					),
					{
						paidPlanLink: <Link href={ paidLink } />,
					}
				) }
			</div>
		);
	}

	if ( ! isStripeConnected ) {
		return (
			<div className="editor-post-visibility__info">
				{ createInterpolateElement(
					__(
						'<stripeAccountLink>Connect to Stripe</stripeAccountLink> to enable paid subscriptions.',
						'jetpack'
					),
					{
						stripeAccountLink: <Link href={ stripeConnectUrl } />,
					}
				) }
			</div>
		);
	}
}

function TierSelector( { onChange } ) {
	// TODO: figure out how to handle different currencies
	const products = useSelect( select => select( membershipProductsStore ).getProducts() )
		.filter( product => product.subscribe_as_site_subscriber && product.interval === '1 month' )
		.sort( product => Number( product.price ) )
		.reverse();

	// Find the current tier meta
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	const [ { [ META_NAME_FOR_POST_TIER_ID_SETTINGS ]: tierId } ] = useEntityProp(
		'postType',
		postType,
		'meta'
	);

	// Tiers don't apply if less than 2 products
	if ( products.length < 2 ) {
		return;
	}

	return (
		<div className="editor-post-tiers">
			{ products.map( product => (
				<div key={ product.id }>
					<input
						type="radio"
						name="tier"
						checked={ Number( tierId ) === product.id }
						value={ product.id }
						onChange={ event => {
							const obj = {};
							obj[ META_NAME_FOR_POST_TIER_ID_SETTINGS ] = event?.target?.value;
							return onChange && onChange( obj );
						} }
						id={ `editor-post-tier-${ product.id }` }
					/>
					<label htmlFor={ `editor-post-tier-${ product.id }` }>
						{ product.title } subscribers
					</label>
				</div>
			) ) }
		</div>
	);
}

export function NewsletterAccessRadioButtons( {
	onChange,
	accessLevel,
	hasNewsletterPlans,
	stripeConnectUrl,
	isEditorPanel = false,
	postHasPaywallBlock: postHasPaywallBlock = false,
} ) {
	const isStripeConnected = stripeConnectUrl === null;
	const instanceId = useInstanceId( NewsletterAccessRadioButtons );
	const { emailSubscribers, paidSubscribers } = useSelect( select =>
		select( membershipProductsStore ).getSubscriberCounts()
	);

	return (
		<fieldset className="editor-post-visibility__fieldset">
			<VisuallyHidden as="legend">{ __( 'Audience', 'jetpack' ) } </VisuallyHidden>
			{ Object.keys( accessOptions ).map( key => {
				if ( key === accessOptions.everybody.key && postHasPaywallBlock ) {
					return;
				}
				const accessLabel = accessOptions[ key ].label;
				const reach =
					key !== accessOptions.everybody.key
						? ` (${ getReachForAccessLevelKey( key, emailSubscribers, paidSubscribers ) })`
						: '';
				return (
					<div className="editor-post-visibility__choice" key={ key }>
						<input
							value={ key }
							type="radio"
							checked={ key === accessLevel }
							className="editor-post-visibility__radio"
							id={ `editor-post-${ key }-${ instanceId }` }
							name={ `editor-newsletter-access__setting-${ instanceId }` }
							aria-describedby={ `editor-post-${ key }-${ instanceId }-description` }
							disabled={
								key === accessOptions.paid_subscribers.key &&
								( ! isStripeConnected || ! hasNewsletterPlans )
							}
							onChange={ event => {
								const obj = {};
								obj[ META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS ] = event?.target?.value;
								return onChange && onChange( obj );
							} }
						/>
						<label
							htmlFor={ `editor-post-${ key }-${ instanceId }` }
							className="editor-post-visibility__label"
						>
							{ accessLabel }
							{ reach }
						</label>
						{
							// This adds a tier selector when:
							// - the paid_subscribers option is selected
							// - stripe is connected
							// - there are newsletter plans (the component will
							//   check for more than 1 plan)
							// - this isn't a paywall block
						 }
						{ key === accessOptions.paid_subscribers.key &&
							key === accessLevel &&
							isStripeConnected &&
							hasNewsletterPlans &&
							! postHasPaywallBlock && <TierSelector onChange={ onChange }></TierSelector> }
					</div>
				);
			} ) }
			{ isEditorPanel && (
				<NewsletterAccessSetupNudge
					stripeConnectUrl={ stripeConnectUrl }
					isStripeConnected={ isStripeConnected }
					hasNewsletterPlans={ hasNewsletterPlans }
				/>
			) }
		</fieldset>
	);
}

export function NewsletterAccessDocumentSettings( { accessLevel, setPostMeta } ) {
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
											onChange={ setPostMeta }
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

export function PaywallBlockSettings( {
	accessLevel,
	setPostMeta,
	stripeConnectUrl,
	hasNewsletterPlans,
} ) {
	const { isLoading } = useSelect( select => {
		const { isApiStateLoading } = select( 'jetpack/membership-products' );
		return {
			isLoading: isApiStateLoading(),
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

	let _accessLevel = accessLevel ?? accessOptions.subscribers.key;
	if ( _accessLevel === accessOptions.everybody.key ) {
		_accessLevel = accessOptions.subscribers.key;
	}

	const accessLabel = accessOptions[ _accessLevel ]?.label;

	const showMisconfigurationWarning = getShowMisconfigurationWarning( postVisibility, accessLevel );

	return (
		<PostVisibilityCheck
			render={ ( { canEdit } ) => (
				<PanelRow className="edit-post-post-visibility">
					<Flex direction="column">
						{ showMisconfigurationWarning && <MisconfigurationWarning /> }
						<FlexBlock direction="row" justify="flex-start">
							{ canEdit && (
								<div className="editor-post-visibility">
									<NewsletterAccessRadioButtons
										isEditorPanel={ true }
										onChange={ setPostMeta }
										accessLevel={ _accessLevel }
										stripeConnectUrl={ stripeConnectUrl }
										hasNewsletterPlans={ hasNewsletterPlans }
										postHasPaywallBlock={ true }
									/>
								</div>
							) }

							{ /* Display the uneditable access level when the user doesn't have edit privileges*/ }
							{ ! canEdit && <span>{ accessLabel }</span> }
						</FlexBlock>
					</Flex>
				</PanelRow>
			) }
		/>
	);
}
