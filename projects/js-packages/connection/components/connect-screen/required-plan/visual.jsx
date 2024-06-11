import {
	ActionButton,
	getRedirectUrl,
	PricingCard,
	TermsOfService,
} from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import debugFactory from 'debug';
import PropTypes from 'prop-types';
import React from 'react';
import ConnectScreenLayout from '../layout';
import './style.scss';

const debug = debugFactory( 'jetpack:connection:ConnectScreenRequiredPlanVisual' );

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
		pricingCurrencyCode = 'USD',
		isLoading = false,
		handleButtonClick = () => {},
		displayButtonError = false,
		buttonIsLoading = false,
		logo,
		isOfflineMode,
		rna = false,
	} = props;

	debug( 'props are %o', props );

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

	const errorMessage = isOfflineMode
		? createInterpolateElement( __( 'Unavailable in <a>Offline Mode</a>', 'jetpack' ), {
				a: (
					<a
						href={ getRedirectUrl( 'jetpack-support-development-mode' ) }
						target="_blank"
						rel="noopener noreferrer"
					/>
				),
		  } )
		: undefined;

	return (
		<ConnectScreenLayout
			title={ title }
			className={ clsx(
				'jp-connection__connect-screen-required-plan',
				isLoading ? 'jp-connection__connect-screen-required-plan__loading' : '',
				rna ? 'rna' : ''
			) }
			logo={ logo }
			rna={ rna }
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
					>
						<TermsOfService agreeButtonLabel={ buttonLabel } />
						<ActionButton
							label={ buttonLabel }
							onClick={ handleButtonClick }
							displayError={ displayButtonError || isOfflineMode }
							errorMessage={ errorMessage }
							isLoading={ buttonIsLoading }
							isDisabled={ isOfflineMode }
						/>
					</PricingCard>
				</div>

				{ ! isOfflineMode && (
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
	pricingIcon: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element ] ),
	/** Whether the connection status is still loading. */
	isLoading: PropTypes.bool,
	/** Callback that is applied into click for all buttons. */
	handleButtonClick: PropTypes.func,
	/** Whether the button error is active or not. */
	displayButtonError: PropTypes.bool,
	/** Whether the button loading state is active or not. */
	buttonIsLoading: PropTypes.bool,
	/** The logo to display at the top of the component. */
	logo: PropTypes.element,
	/** Whether the site is in offline mode. */
	isOfflineMode: PropTypes.bool,
};

export default ConnectScreenRequiredPlanVisual;
