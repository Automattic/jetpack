/**
 * External dependencies
 */
import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import { JetpackLogo, getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ConnectButton from '../connect-button';
import withConnectionStatus from '../with-connection-status';
import ImageSlider from './image-slider';
import './style.scss';

const ConnectButtonWithConnectionStatus = withConnectionStatus( ConnectButton );

/**
 * The Connection Screen component.
 *
 * @param {object} props -- The properties.
 * @param {string} props.apiRoot -- API root URL, required.
 * @param {string} props.apiNonce -- API Nonce, required.
 * @param {string} props.registrationNonce -- Separate registration nonce, required.
 * @param {string} props.redirectUri -- The redirect admin URI.
 * @param {string} props.from -- Where the connection request is coming from.
 * @param {string} props.title -- Page title.
 * @param {Function} props.statusCallback -- Callback to pull connection status from the component.
 * @param {Array} props.images -- Images to display on the right side.
 * @param {string} props.assetBaseUrl -- The assets base URL.
 * @returns {React.Component} The `ConnectScreen` component.
 */
const ConnectScreen = props => {
	const {
		title,
		apiRoot,
		apiNonce,
		registrationNonce,
		from,
		redirectUri,
		statusCallback,
		images,
		children,
		assetBaseUrl,
	} = props;

	const showImageSlider = images.length;

	const [ connectionStatus, setConnectionStatus ] = useState( {} );

	const statusHandler = useCallback(
		status => {
			setConnectionStatus( status );

			if ( statusCallback && {}.toString.call( statusCallback ) === '[object Function]' ) {
				return statusCallback( status );
			}
		},
		[ statusCallback, setConnectionStatus ]
	);

	return (
		<div
			className={
				'jp-connect-screen' +
				( showImageSlider ? ' jp-connect-screen--two-columns' : '' ) +
				( connectionStatus.hasOwnProperty( 'isRegistered' ) ? '' : ' jp-connect-screen--loading' )
			}
		>
			<div className="jp-connect-screen--left">
				<JetpackLogo />

				<h2>{ title }</h2>

				{ children }

				<ConnectButtonWithConnectionStatus
					apiRoot={ apiRoot }
					apiNonce={ apiNonce }
					registrationNonce={ registrationNonce }
					from={ from }
					redirectUri={ redirectUri }
					statusCallback={ statusHandler }
					connectLabel={ __( 'Set up Jetpack', 'jetpack' ) }
				/>

				<div className="jp-connect-screen--tos">
					{ createInterpolateElement(
						__(
							'By clicking the button above, you agree to our <tosLink>Terms of Service</tosLink> and to <shareDetailsLink>share details</shareDetailsLink> with WordPress.com.',
							'jetpack'
						),
						{
							tosLink: (
								<a
									href={ getRedirectUrl( 'wpcom-tos' ) }
									rel="noopener noreferrer"
									target="_blank"
								/>
							),
							shareDetailsLink: (
								<a
									href={ getRedirectUrl( 'jetpack-support-what-data-does-jetpack-sync' ) }
									rel="noopener noreferrer"
									target="_blank"
								/>
							),
						}
					) }
				</div>
			</div>

			{ showImageSlider ? (
				<div className="jp-connect-screen--right">
					<ImageSlider images={ images } assetBaseUrl={ assetBaseUrl } />
				</div>
			) : null }

			<div className="jp-connect-screen--clearfix"></div>
		</div>
	);
};

ConnectScreen.propTypes = {
	title: PropTypes.string,
	body: PropTypes.string,
	apiRoot: PropTypes.string.isRequired,
	apiNonce: PropTypes.string.isRequired,
	from: PropTypes.string,
	redirectUri: PropTypes.string.isRequired,
	registrationNonce: PropTypes.string.isRequired,
	statusCallback: PropTypes.func,
	images: PropTypes.arrayOf( PropTypes.string ),
	assetBaseUrl: PropTypes.string,
};

ConnectScreen.defaultProps = {
	title: __( 'Over 5 million WordPress sites are faster and more secure', 'jetpack' ),
	images: [],
	redirectUri: null,
};

export default ConnectScreen;
