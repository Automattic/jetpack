/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import { JetpackLogo, getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ConnectButton from '../connect-button';
import ImageSlider from './image-slider';
import './style.scss';

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
 * @param {boolean} props.autoTrigger -- Whether to initiate the connection process automatically upon rendering the component.
 * @returns {React.Component} The `ConnectScreen` component.
 */
const ConnectScreen = props => {
	const {
		title,
		buttonLabel,
		apiRoot,
		apiNonce,
		registrationNonce,
		from,
		redirectUri,
		images,
		children,
		assetBaseUrl,
		autoTrigger,
		connectionStatus,
	} = props;

	const showImageSlider = images.length;

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

				<ConnectButton
					apiRoot={ apiRoot }
					apiNonce={ apiNonce }
					registrationNonce={ registrationNonce }
					from={ from }
					redirectUri={ redirectUri }
					connectionStatus={ connectionStatus }
					connectLabel={ buttonLabel }
					autoTrigger={ autoTrigger }
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
	buttonLabel: PropTypes.string,
	apiRoot: PropTypes.string.isRequired,
	apiNonce: PropTypes.string.isRequired,
	from: PropTypes.string,
	redirectUri: PropTypes.string.isRequired,
	registrationNonce: PropTypes.string.isRequired,
	statusCallback: PropTypes.func,
	images: PropTypes.arrayOf( PropTypes.string ),
	assetBaseUrl: PropTypes.string,
	autoTrigger: PropTypes.bool,
	connectionStatus: PropTypes.object.isRequired,
};

ConnectScreen.defaultProps = {
	title: __( 'Over 5 million WordPress sites are faster and more secure', 'jetpack' ),
	buttonLabel: __( 'Set up Jetpack', 'jetpack' ),
	images: [],
	redirectUri: null,
	autoTrigger: false,
};

export default ConnectScreen;
