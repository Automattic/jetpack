/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';

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
	/** The original site URL. */
	wpcomHomeUrl: PropTypes.string.isRequired,
	/** The current site URL */
	currentUrl: PropTypes.string.isRequired,
	/** The redirect URI to redirect users back to after connecting. */
	redirectUri: PropTypes.string.isRequired,
	/** The callback to be called when migration has completed. */
	onMigrated: PropTypes.func,
	/** The main screen title. */
	title: PropTypes.string.isRequired,
	/** The main screen body text. */
	mainBodyText: PropTypes.string.isRequired,
	/** The "Migrate" card title. */
	migrateCardTitle: PropTypes.string,
	/** The "Migrate" card body text. */
	migrateCardBodyText: PropTypes.string,
	/** The "Start Fresh" card title. */
	freshCardTitle: PropTypes.string,
	/** The "Start Fresh" card body text. */
	freshCardBodyText: PropTypes.string,
};

export default ScreenMain;
