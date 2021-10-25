/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import { getRedirectUrl, JetpackLogo, PricingCard } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * The Connection Screen Visual component for consumers that require a Plan.
 *
 * @param {object} props -- The properties.
 * @returns {React.Component} The `ConnectScreenRequiredPlanVisual` component.
 */
const ConnectScreenRequiredPlanVisual = props => {
	const {
		title,
		autoTrigger,
		buttonLabel,
		children,
		connectionStatus,
		priceBefore,
		priceAfter,
		pricingIcon,
		pricingTitle,
		pricingCurrencyCode,
		renderConnectBtn,
	} = props;

	const tos = createInterpolateElement(
		__(
			'By clicking the button above, you agree to our <tosLink>Terms of Service</tosLink> and to <shareDetailsLink>share details</shareDetailsLink> with WordPress.com.',
			'jetpack'
		),
		{
			tosLink: (
				<a href={ getRedirectUrl( 'wpcom-tos' ) } rel="noopener noreferrer" target="_blank" />
			),
			shareDetailsLink: (
				<a
					href={ getRedirectUrl( 'jetpack-support-what-data-does-jetpack-sync' ) }
					rel="noopener noreferrer"
					target="_blank"
				/>
			),
		}
	);

	const withSubscription = createInterpolateElement(
		__( 'Already have a subscription? <connectButton/> to get started.', 'jetpack' ),
		{
			connectButton: renderConnectBtn( __( 'Log in', 'jetpack' ), false ),
		}
	);

	return (
		<div
			className={
				'jp-connection__connect-screen-required-plan' +
				( connectionStatus.hasOwnProperty( 'isRegistered' )
					? ''
					: ' jp-connection__connect-screen-required-plan__loading' )
			}
		>
			<div className="jp-connection__connect-screen-required-plan__content">
				<JetpackLogo />

				<h2>{ title }</h2>

				{ children }

				<div className="jp-connection__connect-screen-required-plan__pricing-card">
					<PricingCard
						title={ pricingTitle }
						icon={ pricingIcon }
						priceBefore={ priceBefore }
						currencyCode={ pricingCurrencyCode }
						priceAfter={ priceAfter }
						infoText={ tos }
					>
						{ renderConnectBtn( buttonLabel, autoTrigger ) }
					</PricingCard>
				</div>

				<div className="jp-connection__connect-screen-required-plan__with-subscription">
					{ withSubscription }
				</div>
			</div>
		</div>
	);
};

ConnectScreenRequiredPlanVisual.propTypes = {
	/** The Pricing Card Title. */
	pricingTitle: PropTypes.string.isRequired,
	/** Price before discount. */
	priceBefore: PropTypes.number.isRequired,
	/** Price after discount. */
	priceAfter: PropTypes.number.isRequired,
	/** The Currency code, eg 'USD'. */
	pricingCurrencyCode: PropTypes.string,
	/** The Title. */
	title: PropTypes.string,
	/** The Connect Button label. */
	buttonLabel: PropTypes.string,
	/** Connection Status object */
	connectionStatus: PropTypes.object.isRequired,
	/** Whether to initiate the connection process automatically upon rendering the component. */
	autoTrigger: PropTypes.bool,
	/** The Pricing Card Icon. */
	pricingIcon: PropTypes.string,
	/** Button element */
	renderConnectBtn: PropTypes.func.isRequired,
};

ConnectScreenRequiredPlanVisual.defaultProps = {
	pricingCurrencyCode: 'USD',
	autoTrigger: false,
};

export default ConnectScreenRequiredPlanVisual;
