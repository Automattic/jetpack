import { getRedirectUrl } from '@automattic/jetpack-components';
import {
	Flex,
	Notice,
	FlexBlock,
	PanelRow,
	VisuallyHidden,
	Spinner,
	Button,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { PostVisibilityCheck, store as editorStore } from '@wordpress/editor';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import { icon as paywallIcon, blockName as paywallBlockName } from '../../blocks/paywall';
import { store as membershipProductsStore } from '../../store/membership-products';
import './settings.scss';
import { accessOptions, META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS } from './constants';
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

export function NewsletterNotice( { accessLevel } ) {
	const { hasPostBeenPublished, hasPostBeenScheduled } = useSelect( select => {
		const { isCurrentPostPublished, isCurrentPostScheduled } = select( editorStore );

		return {
			hasPostBeenPublished: isCurrentPostPublished(),
			hasPostBeenScheduled: isCurrentPostScheduled(),
		};
	} );

	const { emailSubscribers, paidSubscribers } = useSelect( select =>
		select( membershipProductsStore ).getSubscriberCounts()
	);

	const postVisibility = useSelect( select => select( editorStore ).getEditedPostVisibility() );
	const showMisconfigurationWarning = getShowMisconfigurationWarning( postVisibility, accessLevel );

	// If there is a misconfiguration, we do not show the NewsletterNotice
	if ( showMisconfigurationWarning ) {
		return;
	}

	// Get the reach count for the access level
	const reachCount = getReachForAccessLevelKey( accessLevel, emailSubscribers, paidSubscribers );

	if ( 0 === reachCount ) {
		return (
			<FlexBlock>
				<Notice status="info" isDismissible={ false } className="edit-post-post-visibility__notice">
					{ createInterpolateElement(
						__(
							'You don’t have any subscribers yet. How about <importingLink>importing</importingLink> some? Or check out <thisGuideLink>this guide</thisGuideLink> on how to grow your audience.',
							'jetpack'
						),
						{
							importingLink: (
								<Link href={ getRedirectUrl( 'paid-newsletter-import-subscribers' ) } />
							),
							thisGuideLink: (
								<Link href={ getRedirectUrl( 'paid-newsletter-guide-grow-audience' ) } />
							),
						}
					) }
				</Notice>
			</FlexBlock>
		);
	}

	let subscriberType = __( 'subscribers', 'jetpack' );
	if ( accessLevel === accessOptions.paid_subscribers.key ) {
		subscriberType = __( 'paid subscribers', 'jetpack' );
	}

	let numberOfSubscribersText = sprintf(
		/* translators: %1s is the number of subscribers in numerical format, %2s options are paid subscribers or subscribers */
		__( 'This will be sent to <br/><strong>%1$s %2$s</strong>.', 'jetpack' ),
		reachCount,
		subscriberType
	);

	if ( hasPostBeenPublished && ! hasPostBeenScheduled ) {
		numberOfSubscribersText = sprintf(
			/* translators: %1s is the number of subscribers in numerical format, %2s options are paid subscribers or subscribers */
			__( 'This was sent to <strong>%1$s %2$s</strong>.', 'jetpack' ),
			reachCount,
			subscriberType
		);
	}

	return (
		<FlexBlock>
			<Notice status="info" isDismissible={ false } className="edit-post-post-visibility__notice">
				{ createInterpolateElement( numberOfSubscribersText, {
					br: <br />,
					strong: <strong />,
				} ) }
			</Notice>
		</FlexBlock>
	);
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

export function NewsletterAccessRadioButtons( {
	onChange,
	accessLevel,
	hasNewsletterPlans,
	stripeConnectUrl,
	isEditorPanel = false,
	hasPaywallBlock = false,
} ) {
	const isStripeConnected = stripeConnectUrl === null;
	const instanceId = useInstanceId( NewsletterAccessRadioButtons );
	const { emailSubscribers, paidSubscribers } = useSelect( select =>
		select( membershipProductsStore ).getSubscriberCounts()
	);

	return (
		<fieldset className="editor-post-visibility__fieldset">
			<VisuallyHidden as="legend">{ __( 'Audience', 'jetpack' ) } </VisuallyHidden>
			{ Object.keys( accessOptions ).map(
				key =>
					( ! hasPaywallBlock || key !== accessOptions.everybody.key ) && (
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
								{ accessOptions[ key ].label }
								{ sprintf(
									' (%1$s)',
									getReachForAccessLevelKey( key, emailSubscribers, paidSubscribers )
								) }{ ' ' }
							</label>
							{ ! hasPaywallBlock && key === accessLevel && key !== accessOptions.everybody.key && (
								<NewsletterNotice accessLevel={ accessLevel } />
							) }
						</div>
					)
			) }
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
											} }
											variant={ 'link' }
										>
											{ __( 'Click to edit.', 'jetpack' ) }
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
											hasPaywallBlock={ foundPaywallBlock }
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

export function NewsletterAccessPrePublishSettings( { accessLevel, setPostMeta } ) {
	const { hasNewsletterPlans, stripeConnectUrl, isLoading, hasPaywallBlock } = useSelect(
		select => {
			const { getNewsletterProducts, getConnectUrl, isApiStateLoading } = select(
				'jetpack/membership-products'
			);
			const { getBlocks } = select( 'core/block-editor' );

			return {
				isLoading: isApiStateLoading(),
				stripeConnectUrl: getConnectUrl(),
				hasNewsletterPlans: getNewsletterProducts()?.length !== 0,
				hasPaywallBlock: getBlocks().some( block => block.name === paywallBlockName ),
			};
		}
	);

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
				<PanelRow className="edit-post-post-visibility">
					<Flex direction="column">
						{ showMisconfigurationWarning && <MisconfigurationWarning /> }
						{ canEdit && (
							<>
								<FlexBlock>
									<NewsletterAccessRadioButtons
										onChange={ setPostMeta }
										accessLevel={ _accessLevel }
										stripeConnectUrl={ stripeConnectUrl }
										hasNewsletterPlans={ hasNewsletterPlans }
										showMisconfigurationWarning={ showMisconfigurationWarning }
										hasPaywallBlock={ hasPaywallBlock }
									/>
								</FlexBlock>
							</>
						) }

						{ /* Display the uneditable access level when the user doesn't have edit privileges*/ }
						{ ! canEdit && <span>{ accessLabel }</span> }
					</Flex>
				</PanelRow>
			) }
		/>
	);
}

export function PaywallBlockSettings( { accessLevel, setPostMeta } ) {
	const { hasNewsletterPlans, stripeConnectUrl, isLoading } = useSelect( select => {
		const { getNewsletterProducts, getConnectUrl, isApiStateLoading } = select(
			'jetpack/membership-products'
		);
		return {
			isLoading: isApiStateLoading(),
			stripeConnectUrl: getConnectUrl(),
			hasNewsletterPlans: getNewsletterProducts()?.length !== 0,
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
										hasPaywallBlock={ true }
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
