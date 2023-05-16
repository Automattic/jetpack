import { getRedirectUrl } from '@automattic/jetpack-components';
// eslint-disable-next-line wpcalypso/no-unsafe-wp-apis
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';
import {
	Flex,
	Notice,
	FlexBlock,
	Button,
	PanelRow,
	Dropdown,
	VisuallyHidden,
	Spinner,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { PostVisibilityCheck } from '@wordpress/editor';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS, accessOptions } from './constants';
import { getPaidPlanLink, MisconfigurationWarning } from './utils';

import './settings.scss';

function Link( { href, children } ) {
	return (
		<a target="_blank" rel="noopener noreferrer" href={ href } className="jetpack-newsletter-link">
			{ children }
		</a>
	);
}

function getReachForAccessLevelKey(
	accessLevelKey,
	emailSubscribers,
	paidSubscribers,
	socialFollowers
) {
	if ( emailSubscribers === null || paidSubscribers === null || socialFollowers === null ) {
		return 0;
	}

	switch ( accessOptions[ accessLevelKey ].key ) {
		case accessOptions.everybody.key:
			return emailSubscribers;
		case accessOptions.subscribers.key:
			return emailSubscribers;
		case accessOptions.paid_subscribers.key:
			return paidSubscribers;
		default:
			return 0;
	}
}

function NewsletterLearnMore() {
	return (
		<small className="jetpack-newsletter-learn-more">
			{ createInterpolateElement(
				__(
					'Restrict your post to subscribers. <learnMoreLink>Learn more.</learnMoreLink>',
					'jetpack'
				),
				{
					learnMoreLink: (
						<Link
							href={ getRedirectUrl( 'paid-newsletter-info', {
								anchor: 'memberships-and-subscriptions',
							} ) }
						/>
					),
				}
			) }
		</small>
	);
}

function NewsletterNotice( {
	accessLevel,
	socialFollowers,
	emailSubscribers,
	paidSubscribers,
	showMisconfigurationWarning,
} ) {
	// Get the reach count for the access level
	let reachCount = getReachForAccessLevelKey(
		accessLevel,
		emailSubscribers,
		paidSubscribers,
		socialFollowers
	);

	// If there is a misconfiguration, we do not show the NewsletterNotice
	if ( showMisconfigurationWarning ) {
		return;
	}

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

	if ( accessOptions.everybody.key === accessLevel ) {
		reachCount = reachCount + '+'; // Concat "+"
	}

	return (
		<FlexBlock>
			<Notice status="info" isDismissible={ false } className="edit-post-post-visibility__notice">
				{ createInterpolateElement(
					sprintf(
						/* translators: %s is the number of subscribers in numerical format */
						__( 'This will be sent to <strong>%s subscribers</strong>.', 'jetpack' ),
						reachCount
					),
					{ strong: <strong /> }
				) }
			</Notice>
		</FlexBlock>
	);
}

function NewsletterAccessSetupNudge( { stripeConnectUrl, isStripeConnected, hasNewsletterPlans } ) {
	const paidLink = getPaidPlanLink( true );

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
					__( '<paidPlanLink>Set up a paid plan</paidPlanLink> to enable this option', 'jetpack' ),
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
						'<stripeAccountLink>Connect to Stripe</stripeAccountLink> to enable payments',
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

function NewsletterAccessRadioButtons( {
	onChange,
	accessLevel,
	socialFollowers,
	emailSubscribers,
	paidSubscribers,
	hasNewsletterPlans,
	stripeConnectUrl,
	isPrePublishPanel = false,
	showMisconfigurationWarning,
} ) {
	const isStripeConnected = stripeConnectUrl === null;
	const instanceId = useInstanceId( NewsletterAccessRadioButtons );

	return (
		<fieldset className="editor-post-visibility__fieldset">
			<VisuallyHidden as="legend">{ __( 'Audience', 'jetpack' ) } </VisuallyHidden>
			{ Object.keys( accessOptions ).map( key => (
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

						{ /* Do not show subscriber numbers in the PrePublish panel */ }
						{ ! isPrePublishPanel &&
							' (' +
								getReachForAccessLevelKey(
									key,
									emailSubscribers,
									paidSubscribers,
									socialFollowers
								) +
								( key === accessOptions.everybody.key ? '+' : '' ) +
								')' }
					</label>
					<p
						id={ `editor-post-${ key }-${ instanceId }-description` }
						className="editor-post-visibility__info"
					>
						{ accessOptions[ key ].info }
					</p>

					{ /* Only show the notice below each access radio buttons in the PrePublish panel  */ }
					{ isPrePublishPanel && key === accessLevel && (
						<p className="pre-public-panel-notice-reach">
							<NewsletterNotice
								accessLevel={ accessLevel }
								socialFollowers={ socialFollowers }
								emailSubscribers={ emailSubscribers }
								paidSubscribers={ paidSubscribers }
								showMisconfigurationWarning={ showMisconfigurationWarning }
							/>
						</p>
					) }
				</div>
			) ) }
			<NewsletterAccessSetupNudge
				stripeConnectUrl={ stripeConnectUrl }
				hasNewsletterPlans={ hasNewsletterPlans }
				isStripeConnected={ isStripeConnected }
			/>
		</fieldset>
	);
}

export function NewsletterAccessDocumentSettings( {
	accessLevel,
	setPostMeta,
	socialFollowers,
	emailSubscribers,
	paidSubscribers,
	showMisconfigurationWarning,
} ) {
	const { hasNewsletterPlans, stripeConnectUrl, isLoading } = useSelect( select => {
		const { getProducts, getConnectUrl, isApiStateLoading } = select(
			'jetpack/membership-products'
		);

		return {
			isLoading: isApiStateLoading(),
			stripeConnectUrl: getConnectUrl(),
			hasNewsletterPlans:
				getProducts()?.filter( product => product.subscribe_as_site_subscriber )?.length !== 0,
		};
	} );

	if ( isLoading ) {
		return (
			<Flex direction="column" align="center">
				<Spinner />
			</Flex>
		);
	}

	const _accessLevel = accessLevel ?? accessOptions.everybody.key;
	const accessLabel = accessOptions[ _accessLevel ]?.label;

	// Immediately close the dropdown dialog after setting the post meta.
	const setPostMetaAndClose = onClose => {
		return meta => {
			setPostMeta( meta );
			onClose();
		};
	};

	return (
		<PostVisibilityCheck
			render={ ( { canEdit } ) => (
				<PanelRow className="edit-post-post-visibility">
					<Flex direction="column">
						{ showMisconfigurationWarning && <MisconfigurationWarning /> }
						<Flex direction="row" justify="flex-start">
							<span>{ __( 'Access', 'jetpack' ) }</span>
							{ canEdit && (
								<Dropdown
									focusOnMount
									placement="bottom-end"
									contentClassName="edit-post-post-visibility__dialog"
									renderToggle={ ( { isOpen, onToggle } ) => (
										<Button
											variant="tertiary"
											onClick={ onToggle }
											aria-expanded={ isOpen }
											aria-label={ sprintf(
												// translators: %s: Current newsletter post access.
												__( 'Select audience: %s', 'jetpack' ),
												accessLabel
											) }
										>
											{ accessLabel }
										</Button>
									) }
									renderContent={ ( { onClose } ) => (
										<div className="editor-post-visibility">
											<InspectorPopoverHeader
												onClose={ onClose }
												title={ __( 'Access settings', 'jetpack' ) }
												help={ __( 'Control how this newsletter is viewed.', 'jetpack' ) }
											/>
											<NewsletterAccessRadioButtons
												onChange={ setPostMetaAndClose( onClose ) }
												accessLevel={ _accessLevel }
												socialFollowers={ socialFollowers }
												emailSubscribers={ emailSubscribers }
												paidSubscribers={ paidSubscribers }
												stripeConnectUrl={ stripeConnectUrl }
												hasNewsletterPlans={ hasNewsletterPlans }
												showMisconfigurationWarning={ showMisconfigurationWarning }
											/>
										</div>
									) }
								/>
							) }

							{ /* Display the uneditable access level when the user doesn't have edit privileges*/ }
							{ ! canEdit && <span>{ accessLabel }</span> }
						</Flex>

						<NewsletterNotice
							accessLevel={ _accessLevel }
							socialFollowers={ socialFollowers }
							emailSubscribers={ emailSubscribers }
							paidSubscribers={ paidSubscribers }
							showMisconfigurationWarning={ showMisconfigurationWarning }
						/>

						<FlexBlock>
							<NewsletterLearnMore />
						</FlexBlock>
					</Flex>
				</PanelRow>
			) }
		/>
	);
}

export function NewsletterAccessPrePublishSettings( {
	accessLevel,
	setPostMeta,
	socialFollowers,
	emailSubscribers,
	paidSubscribers,
	showMisconfigurationWarning,
} ) {
	const { hasNewsletterPlans, stripeConnectUrl, isLoading } = useSelect( select => {
		const { getProducts, getConnectUrl, isApiStateLoading } = select(
			'jetpack/membership-products'
		);

		return {
			isLoading: isApiStateLoading(),
			stripeConnectUrl: getConnectUrl(),
			hasNewsletterPlans:
				getProducts()?.filter( product => product.subscribe_as_site_subscriber )?.length !== 0,
		};
	} );

	if ( isLoading ) {
		return (
			<Flex direction="column" align="center">
				<Spinner />
			</Flex>
		);
	}

	const _accessLevel = accessLevel ?? accessOptions.everybody.key;
	const accessLabel = accessOptions[ _accessLevel ]?.label;

	return (
		<PostVisibilityCheck
			render={ ( { canEdit } ) => (
				<PanelRow className="edit-post-post-visibility">
					<Flex direction="column">
						{ showMisconfigurationWarning && MisconfigurationWarning() }
						{ canEdit && (
							<>
								<FlexBlock>
									<NewsletterAccessRadioButtons
										onChange={ setPostMeta }
										accessLevel={ _accessLevel }
										socialFollowers={ socialFollowers }
										emailSubscribers={ emailSubscribers }
										paidSubscribers={ paidSubscribers }
										stripeConnectUrl={ stripeConnectUrl }
										hasNewsletterPlans={ hasNewsletterPlans }
										isPrePublishPanel={ true }
										showMisconfigurationWarning={ showMisconfigurationWarning }
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
