/**
 * External dependencies
 */
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import restApi from '@automattic/jetpack-api';
import { getRedirectUrl, JetpackLogo } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import CardMigrate from '../card-migrate';
import CardFresh from '../card-fresh';
import SafeMode from '../safe-mode';
import './style.scss';

/**
 * The IDC screen component.
 *
 * @param {object} props - The properties.
 * @param {React.Component} props.logo - The screen logo, Jetpack by default.
 * @param {string} props.headerText - The header text, 'Safe Mode' by default.
 * @param {string} props.wpcomHomeUrl - The original site URL.
 * @param {string} props.currentUrl - The current site URL.
 * @param {string} props.apiRoot -- API root URL, required.
 * @param {string} props.apiNonce -- API Nonce, required.
 * @returns {React.Component} The `ConnectScreen` component.
 */
const IDCScreen = props => {
	const { logo, headerText, wpcomHomeUrl, currentUrl, apiNonce, apiRoot } = props;

	/**
	 * Initialize the REST API.
	 */
	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	return (
		<div className="jp-idc-screen-base">
			<div className="jp-idc-header">
				<div className="jp-idc-logo">{ logo }</div>
				<div className="jp-idc-logo-label">{ headerText }</div>
			</div>

			<h2>{ __( 'Safe Mode has been activated', 'jetpack' ) }</h2>

			<p>
				{ createInterpolateElement(
					__(
						'Your site is in Safe Mode because you have 2 Jetpack-powered sites that appear to be duplicates. ' +
							'2 sites that are telling Jetpack they’re the same site. <safeModeLink>Learn more about safe mode.</safeModeLink>',
						'jetpack'
					),
					{
						safeModeLink: (
							<a
								href={ getRedirectUrl( 'jetpack-support-safe-mode' ) }
								rel="noopener noreferrer"
								target="_blank"
							/>
						),
					}
				) }
			</p>

			<h3>{ __( 'Please select an option', 'jetpack' ) }</h3>

			<div className="jp-idc-cards">
				<CardMigrate wpcomHomeUrl={ wpcomHomeUrl } currentUrl={ currentUrl } />
				<div className="jp-idc-cards-separator">or</div>
				<CardFresh wpcomHomeUrl={ wpcomHomeUrl } currentUrl={ currentUrl } />
			</div>

			<SafeMode />
		</div>
	);
};

IDCScreen.propTypes = {
	logo: PropTypes.object.isRequired,
	headerText: PropTypes.string.isRequired,
	wpcomHomeUrl: PropTypes.string.isRequired,
	currentUrl: PropTypes.string.isRequired,
	apiRoot: PropTypes.string.isRequired,
	apiNonce: PropTypes.string.isRequired,
};

IDCScreen.defaultProps = {
	logo: <JetpackLogo height={ 24 } />,
	headerText: __( 'Safe Mode', 'jetpack' ),
};

export default IDCScreen;
