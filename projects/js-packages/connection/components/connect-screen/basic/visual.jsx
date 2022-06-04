import { getRedirectUrl, ActionButton } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
import ConnectScreenLayout from '../layout';
import './style.scss';

export const ToS = createInterpolateElement(
	__(
		'By clicking the button above, you agree to our <tosLink>Terms of Service</tosLink> and to <shareDetailsLink>share details</shareDetailsLink> with WordPress.com.',
		'jetpack'
	),
	{
		tosLink: <a href={ getRedirectUrl( 'wpcom-tos' ) } rel="noopener noreferrer" target="_blank" />,
		shareDetailsLink: (
			<a
				href={ getRedirectUrl( 'jetpack-support-what-data-does-jetpack-sync' ) }
				rel="noopener noreferrer"
				target="_blank"
			/>
		),
	}
);

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
		showConnectButton,
		buttonLabel,
		handleButtonClick,
		displayButtonError,
		buttonIsLoading,
		footer,
	} = props;

	return (
		<ConnectScreenLayout
			title={ title }
			assetBaseUrl={ assetBaseUrl }
			images={ images }
			className={
				'jp-connection__connect-screen' +
				( isLoading ? ' jp-connection__connect-screen__loading' : '' )
			}
		>
			<div className="jp-connection__connect-screen__content">
				{ children }

				{ showConnectButton && (
					<>
						<ActionButton
							label={ buttonLabel }
							onClick={ handleButtonClick }
							displayError={ displayButtonError }
							isLoading={ buttonIsLoading }
						/>

						<div className="jp-connection__connect-screen__tos">{ ToS }</div>
					</>
				) }

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
	/** Whether the connection button appears or not. */
	showConnectButton: PropTypes.bool,
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
};

ConnectScreenVisual.defaultProps = {
	showConnectButton: true,
	isLoading: false,
	buttonIsLoading: false,
	displayButtonError: false,
	handleButtonClick: () => {},
	footer: null,
};

export default ConnectScreenVisual;
