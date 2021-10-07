/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getRedirectUrl, JetpackLogo } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import CardMigrate from '../card-migrate';
import CardFresh from '../card-fresh';
import './style.scss';

/**
 * The safe mode screen component.
 *
 * @param {object} props - The properties.
 * @param {React.Component} props.logo - The screen logo, Jetpack by default.
 * @param {string} props.headerText - The header text, 'Safe Mode' by default.
 * @param {string} props.wpcomHomeUrl - The original site URL.
 * @param {string} props.currentUrl - The current site URL.
 * @returns {React.Component} The `ConnectScreen` component.
 */
const IDCScreen = props => {
	const { logo, headerText, wpcomHomeUrl, currentUrl } = props;

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
		</div>
	);
};

IDCScreen.propTypes = {
	logo: PropTypes.object.isRequired,
	headerText: PropTypes.string.isRequired,
	wpcomHomeUrl: PropTypes.string.isRequired,
	currentUrl: PropTypes.string.isRequired,
};

IDCScreen.defaultProps = {
	logo: <JetpackLogo height={ 24 } />,
	headerText: __( 'Safe Mode', 'jetpack' ),
};

export default IDCScreen;
