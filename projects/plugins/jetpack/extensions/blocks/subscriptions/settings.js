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
import { META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS } from './constants';
import { getPaidPlanLink } from './utils';

import './settings.scss';

export const accessOptions = {
	everybody: {
		key: 'everybody',
		label: __( 'Everybody', 'jetpack' ),
		info: __( 'Visible to everyone.', 'jetpack' ),
	},
	subscribers: {
		key: 'subscribers',
		label: __( 'All subscribers', 'jetpack' ),
		info: __( 'Anyone subscribed to your newsletter.', 'jetpack' ),
	},
	paid_subscribers: {
		key: 'paid_subscribers',
		label: __( 'Paid subscribers', 'jetpack' ),
		info: __( 'Only for paid subscribers.', 'jetpack' ),
	},
};

function Link( { slug, children } ) {
	return (
		<a
			target="_blank"
			rel="noopener noreferrer"
			href={ getRedirectUrl( slug ) }
			className="jetpack-newsletter-link"
		>
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
							slug={ getRedirectUrl( 'paid-newsletter-info', {
								anchor: 'memberships-and-subscriptions',
							} ) }
						/>
					),
				}
			) }
		</small>
	);
}

function NewsletterNotice( { accessLevel, socialFollowers, emailSubscribers, paidSubscribers } ) {
	// Get the reach count for the access level
	let reachCount = getReachForAccessLevelKey(
		accessLevel,
		emailSubscribers,
		paidSubscribers,
		socialFollowers
	);

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
								<Link
									slug={
										'https://wordpress.com/support/launch-a-newsletter/import-subscribers-to-a-newsletter/'
									}
								/>
							),
							thisGuideLink: (
								<Link slug={ 'https://wordpress.com/support/category/grow-your-audience' } />
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
				{ __( 'This will be sent to ', 'jetpack' ) }
				<strong>
					{ sprintf(
						// translators: %s: The newsletter reach based on the access level
						__( '%s subscribers.', 'jetpack' ),
						reachCount
					) }
				</strong>
			</Notice>
		</FlexBlock>
	);
}

function NewsletterAccessSetupNudge( { connectUrl, isStripeConnected, hasNewsletterPlans } ) {
	const paidLink = getPaidPlanLink( hasNewsletterPlans );

	if ( ! hasNewsletterPlans && ! isStripeConnected ) {
		return (
			<div className="editor-post-visibility__info">
				{ createInterpolateElement(
					__(
						"You'll need a <paidPlanLink>paid plan</paidPlanLink> and a <stripeAccountLink>Stripe account</stripeAccountLink> to collect payments.",
						'jetpack'
					),
					{
						stripeAccountLink: <Link slug={ '#' } />,
						paidPlanLink: <Link slug={ paidLink } />,
					}
				) }
			</div>
		);
	}

	if ( ! hasNewsletterPlans ) {
		return (
			<div className="editor-post-visibility__info">
				{ createInterpolateElement(
					__( 'Click here to <paidPlanLink>add a paid plan.</paidPlanLink>', 'jetpack' ),
					{
						paidPlanLink: <Link slug={ paidLink } />,
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
						stripeAccountLink: <Link slug={ connectUrl } />,
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
						name={ `editor-post-visibility__setting-${ instanceId }` }
						aria-describedby={ `editor-post-${ key }-${ instanceId }-description` }
						disabled={ key === accessOptions.paid_subscribers.key && ! isStripeConnected }
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
						{ ! isPrePublishPanel && '(' +
							getReachForAccessLevelKey( key, emailSubscribers, paidSubscribers, socialFollowers ) +
							( key === accessOptions.everybody.key ? '+' : '' ) +
							')'
						}
					</label>
					<p
						id={ `editor-post-${ key }-${ instanceId }-description` }
						className="editor-post-visibility__info"
					>
						{ accessOptions[ key ].info }
					</p>

					{ /* Only show the notice below each access radio buttons in the PrePublish panel  */ }
					{ isPrePublishPanel && key === accessLevel && (
						<p>
							<NewsletterNotice
								accessLevel={ accessLevel }
								socialFollowers={ socialFollowers }
								emailSubscribers={ emailSubscribers }
								paidSubscribers={ paidSubscribers }
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
												onChange={ setPostMeta }
												accessLevel={ _accessLevel }
												socialFollowers={ socialFollowers }
												emailSubscribers={ emailSubscribers }
												paidSubscribers={ paidSubscribers }
												stripeConnectUrl={ stripeConnectUrl }
												hasNewsletterPlans={ hasNewsletterPlans }
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
