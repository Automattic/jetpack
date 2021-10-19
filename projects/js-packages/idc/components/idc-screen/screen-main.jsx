/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import CardMigrate from '../card-migrate';
import CardFresh from '../card-fresh';
import SafeMode from '../safe-mode';

/**
 * Retrieve the main screen body.
 *
 * @param {object} props - The properties.
 * @param {string} props.wpcomHomeUrl - The original site URL.
 * @param {string} props.currentUrl - The current site URL.
 * @param {Function} props.onMigrated - The callback to be called when migration has completed.
 * @returns {React.Component} The ScreenMain component.
 */
const ScreenMain = props => {
	const { wpcomHomeUrl, currentUrl, onMigrated } = props;

	return (
		<React.Fragment>
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
				<CardMigrate
					wpcomHomeUrl={ wpcomHomeUrl }
					currentUrl={ currentUrl }
					onMigrated={ onMigrated }
				/>
				<div className="jp-idc-cards-separator">or</div>
				<CardFresh wpcomHomeUrl={ wpcomHomeUrl } currentUrl={ currentUrl } />
			</div>

			<SafeMode />
		</React.Fragment>
	);
};

ScreenMain.propTypes = {
	wpcomHomeUrl: PropTypes.string.isRequired,
	currentUrl: PropTypes.string.isRequired,
	onMigrated: PropTypes.func,
};

export default ScreenMain;
