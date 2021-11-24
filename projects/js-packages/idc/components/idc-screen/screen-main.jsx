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
 * @param {string} props.redirectUri - The redirect URI to redirect users back to after connecting.
 * @param {Function} props.onMigrated - The callback to be called when migration has completed.
 * @param {string} props.title - The main screen title.
 * @param {string} props.mainBodyText - The main screen body text.
 * @param {string} props.migrateCardTitle - The "Migrate" card title.
 * @param {string} props.migrateCardBodyText - The "Migrate" card body text.
 * @param {string} props.freshCardTitle - The "Start Fresh" card title.
 * @param {string} props.freshCardBodyText - The "Start Fresh" card body text.
 * @returns {React.Component} The ScreenMain component.
 */
const ScreenMain = props => {
	const {
		title,
		mainBodyText,
		wpcomHomeUrl,
		currentUrl,
		onMigrated,
		redirectUri,
		migrateCardBodyText,
		migrateCardTitle,
		freshCardTitle,
		freshCardBodyText,
	} = props;

	return (
		<React.Fragment>
			<h2>{ title }</h2>

			<p>{ mainBodyText }</p>

			<h3>{ __( 'Please select an option', 'jetpack' ) }</h3>

			<div className="jp-idc__idc-screen__cards">
				<CardMigrate
					wpcomHomeUrl={ wpcomHomeUrl }
					currentUrl={ currentUrl }
					onMigrated={ onMigrated }
					title={ migrateCardTitle }
					bodyText={ migrateCardBodyText }
				/>
				<div className="jp-idc__idc-screen__cards-separator">or</div>
				<CardFresh
					wpcomHomeUrl={ wpcomHomeUrl }
					currentUrl={ currentUrl }
					redirectUri={ redirectUri }
					title={ freshCardTitle }
					bodyText={ freshCardBodyText }
				/>
			</div>

			<SafeMode />
		</React.Fragment>
	);
};

ScreenMain.propTypes = {
	wpcomHomeUrl: PropTypes.string.isRequired,
	currentUrl: PropTypes.string.isRequired,
	redirectUri: PropTypes.string.isRequired,
	onMigrated: PropTypes.func,
	title: PropTypes.string.isRequired,
	mainBodyText: PropTypes.string.isRequired,
	migrateCardTitle: PropTypes.string,
	migrateCardBodyText: PropTypes.string,
	freshCardTitle: PropTypes.string,
	freshCardBodyText: PropTypes.string,
};

ScreenMain.defaultProps = {
	title: __( 'Safe Mode has been activated', 'jetpack' ),
	mainBodyText: createInterpolateElement(
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
	),
};

export default ScreenMain;
