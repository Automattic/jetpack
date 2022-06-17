import { getRedirectUrl, PricingCard, ActionButton } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
import ConnectScreenLayout from '../layout';
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
		buttonLabel,
		children,
		priceBefore,
		priceAfter,
		pricingIcon,
		pricingTitle,
		pricingCurrencyCode,
		isLoading,
		handleButtonClick,
		showConnectButton,
		displayButtonError,
		buttonIsLoading,
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
		__( 'Already have a subscription? <connectButton/>', 'jetpack' ),
		{
			connectButton: (
				<ActionButton
					label={ __( 'Log in to get started', 'jetpack' ) }
					onClick={ handleButtonClick }
					isLoading={ buttonIsLoading }
				/>
			),
		}
	);

	return (
		<ConnectScreenLayout
			title={ title }
			className={
				'jp-connection__connect-screen-required-plan' +
				( isLoading ? ' jp-connection__connect-screen-required-plan__loading' : '' )
			}
		>
			<div className="jp-connection__connect-screen-required-plan__content">
				{ children }

				<div className="jp-connection__connect-screen-required-plan__pricing-card">
					<PricingCard
						title={ pricingTitle }
						icon={ pricingIcon }
						priceBefore={ priceBefore }
						currencyCode={ pricingCurrencyCode }
						priceAfter={ priceAfter }
						infoText={ showConnectButton ? tos : '' }
					>
						{ showConnectButton && (
							<ActionButton
								label={ buttonLabel }
								onClick={ handleButtonClick }
								displayError={ displayButtonError }
								isLoading={ buttonIsLoading }
							/>
						) }
					</PricingCard>
				</div>

				{ showConnectButton && (
					<div className="jp-connection__connect-screen-required-plan__with-subscription">
						{ withSubscription }
					</div>
				) }
			</div>
		</ConnectScreenLayout>
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
	/** The Pricing Card Icon. */
	pricingIcon: PropTypes.string,
	/** Whether the connection status is still loading. */
	isLoading: PropTypes.bool,
	/** Callback that is applied into click for all buttons. */
	handleButtonClick: PropTypes.func,
	/** Whether the connection button is enable or not. */
	showConnectButton: PropTypes.bool,
	/** Whether the button error is active or not. */
	displayButtonError: PropTypes.bool,
	/** Whether the button loading state is active or not. */
	buttonIsLoading: PropTypes.bool,
};

ConnectScreenRequiredPlanVisual.defaultProps = {
	pricingCurrencyCode: 'USD',
	showConnectButton: true,
	isLoading: false,
	buttonIsLoading: false,
	displayButtonError: false,
	handleButtonClick: () => {},
};

export default ConnectScreenRequiredPlanVisual;
