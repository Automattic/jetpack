import { ActionButton, getRedirectUrl, TermsOfService } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
import ConnectScreenLayout from '../layout';
import './style.scss';

/**
 * The Connection Screen Visual component..
 *
 * @param {object} props -- The properties.
 * @returns {React.Component} The `ConnectScreenRequiredPlanVisual` component.
 */
const ConnectScreenVisual = props => {
	const {
		title,
		images,
		children,
		assetBaseUrl,
		isLoading,
		buttonLabel,
		handleButtonClick,
		displayButtonError,
		errorCode,
		buttonIsLoading,
		loadingLabel,
		footer,
		isOfflineMode,
		logo,
	} = props;

	const getErrorMessage = () => {
		// Explicit error code takes precedence over the offline mode.
		switch ( errorCode ) {
			case 'fail_domain_forbidden':
			case 'fail_ip_forbidden':
			case 'fail_domain_tld':
			case 'fail_subdomain_wpcom':
			case 'siteurl_private_ip':
				return __(
					'Your site host is on a private network. Jetpack can only connect to public sites.',
					'jetpack'
				);
		}

		if ( isOfflineMode ) {
			return createInterpolateElement( __( 'Unavailable in <a>Offline Mode</a>', 'jetpack' ), {
				a: (
					<a
						href={ getRedirectUrl( 'jetpack-support-development-mode' ) }
						target="_blank"
						rel="noopener noreferrer"
					/>
				),
			} );
		}
	};

	const errorMessage = getErrorMessage( errorCode, isOfflineMode );

	return (
		<ConnectScreenLayout
			title={ title }
			assetBaseUrl={ assetBaseUrl }
			images={ images }
			className={
				'jp-connection__connect-screen' +
				( isLoading ? ' jp-connection__connect-screen__loading' : '' )
			}
			logo={ logo }
		>
			<div className="jp-connection__connect-screen__content">
				{ children }

				<div className="jp-connection__connect-screen__tos">
					<TermsOfService agreeButtonLabel={ buttonLabel } />
				</div>
				<ActionButton
					label={ buttonLabel }
					onClick={ handleButtonClick }
					displayError={ displayButtonError || isOfflineMode }
					errorMessage={ errorMessage }
					isLoading={ buttonIsLoading }
					isDisabled={ isOfflineMode }
				/>
				<span className="jp-connection__connect-screen__loading-message" role="status">
					{ buttonIsLoading ? loadingLabel : '' }
				</span>

				{ footer && <div className="jp-connection__connect-screen__footer">{ footer }</div> }
			</div>
		</ConnectScreenLayout>
	);
};

ConnectScreenVisual.propTypes = {
	/** The Title. */
	title: PropTypes.string,
	/** Images to display on the right side. */
	images: PropTypes.arrayOf( PropTypes.string ),
	/** The assets base URL. */
	assetBaseUrl: PropTypes.string,
	/** Whether the connection status is still loading. */
	isLoading: PropTypes.bool,
	/** Text label to be used into button. */
	buttonLabel: PropTypes.string.isRequired,
	/** Callback to be called on button click. */
	handleButtonClick: PropTypes.func,
	/** Whether the error message appears or not. */
	displayButtonError: PropTypes.bool,
	/** The connection error code. */
	errorCode: PropTypes.string,
	/** Whether the button is loading or not. */
	buttonIsLoading: PropTypes.bool,
	/** Text read by screen readers after the button is activated */
	loadingLabel: PropTypes.string,
	/** Node that will be rendered after ToS */
	footer: PropTypes.node,
	/** Whether the site is in offline mode. */
	isOfflineMode: PropTypes.bool,
	/** The logo to display at the top of the component. */
	logo: PropTypes.element,
};

ConnectScreenVisual.defaultProps = {
	isLoading: false,
	buttonIsLoading: false,
	loadingLabel: __( 'Loading', 'jetpack' ),
	displayButtonError: false,
	errorCode: null,
	handleButtonClick: () => {},
	footer: null,
	isOfflineMode: false,
};

export default ConnectScreenVisual;
