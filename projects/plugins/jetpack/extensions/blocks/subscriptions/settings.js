import { getRedirectUrl } from '@automattic/jetpack-components';
import { Flex, Notice, FlexBlock, PanelRow, VisuallyHidden, Spinner } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { PostVisibilityCheck, store as editorStore } from '@wordpress/editor';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS, accessOptions } from './constants';
import { getPaidPlanLink, MisconfigurationWarning } from './utils';

import './settings.scss';

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

function NewsletterLearnMore() {
	return (
		<small className="jetpack-newsletter-learn-more">
			{ createInterpolateElement(
				__(
					'Restrict your post to subscribers. <learnMoreLink>Learn more.</learnMoreLink>',
					'jetpack'
				),
				{
					learnMoreLink: <Link href={ getRedirectUrl( 'paid-newsletter-info' ) } />,
				}
			) }
		</small>
	);
}

export function NewsletterNotice( {
	accessLevel,
	emailSubscribers,
	paidSubscribers,
	showMisconfigurationWarning,
} ) {
	const { hasPostBeenPublished, hasPostBeenScheduled } = useSelect( select => {
		const { isCurrentPostPublished, isCurrentPostScheduled } = select( editorStore );

		return {
			hasPostBeenPublished: isCurrentPostPublished(),
			hasPostBeenScheduled: isCurrentPostScheduled(),
		};
	} );

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

	let numberOfSubscribersText = sprintf(
		/* translators: %s is the number of subscribers in numerical format */
		__( 'This will also be sent to <br/><strong>%s subscribers</strong>.', 'jetpack' ),
		reachCount
	);

	if ( hasPostBeenPublished && ! hasPostBeenScheduled ) {
		numberOfSubscribersText = sprintf(
			/* translators: %s is the number of subscribers in numerical format */
			__( 'This was sent to <strong>%s subscribers</strong>.', 'jetpack' ),
			reachCount
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

function NewsletterAccessRadioButtons( {
	onChange,
	accessLevel,
	emailSubscribers,
	paidSubscribers,
	hasNewsletterPlans,
	stripeConnectUrl,
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
					</label>
					{ key === accessLevel && (
						<p className="editor-post-visibility__notice">
							<NewsletterNotice
								accessLevel={ accessLevel }
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
						{ showMisconfigurationWarning && <MisconfigurationWarning /> }
						<FlexBlock direction="row" justify="flex-start">
							{ canEdit && (
								<div className="editor-post-visibility">
									<NewsletterAccessRadioButtons
										onChange={ setPostMeta }
										accessLevel={ _accessLevel }
										emailSubscribers={ emailSubscribers }
										paidSubscribers={ paidSubscribers }
										stripeConnectUrl={ stripeConnectUrl }
										hasNewsletterPlans={ hasNewsletterPlans }
										showMisconfigurationWarning={ showMisconfigurationWarning }
									/>
								</div>
							) }

							{ /* Display the uneditable access level when the user doesn't have edit privileges*/ }
							{ ! canEdit && <span>{ accessLabel }</span> }
						</FlexBlock>
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
										emailSubscribers={ emailSubscribers }
										paidSubscribers={ paidSubscribers }
										stripeConnectUrl={ stripeConnectUrl }
										hasNewsletterPlans={ hasNewsletterPlans }
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
