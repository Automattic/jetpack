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
		buttonIsLoading,
		footer,
		isOfflineMode,
		logo,
	} = props;

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
	/** Whether the button is loading or not. */
	buttonIsLoading: PropTypes.bool,
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
	displayButtonError: false,
	handleButtonClick: () => {},
	footer: null,
	isOfflineMode: false,
};

export default ConnectScreenVisual;
