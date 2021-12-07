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
 * @returns {React.Component} The ScreenMain component.
 */
const ScreenMain = props => {
	const {
		wpcomHomeUrl,
		currentUrl,
		isMigrating,
		migrateCallback,
		isStartingFresh,
		startFreshCallback,
		title,
		mainBodyText,
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
					isMigrating={ isMigrating }
					migrateCallback={ migrateCallback }
				/>
				<div className="jp-idc__idc-screen__cards-separator">or</div>
				<CardFresh
					wpcomHomeUrl={ wpcomHomeUrl }
					currentUrl={ currentUrl }
					isStartingFresh={ isStartingFresh }
					startFreshCallback={ startFreshCallback }
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
	/** Whether the migration is in progress. */
	isMigrating: PropTypes.bool.isRequired,
	/** Migration callback. */
	migrateCallback: PropTypes.func,
	/** Whether starting fresh is in progress. */
	isStartingFresh: PropTypes.bool.isRequired,
	/** "Start Fresh" callback. */
	startFreshCallback: PropTypes.func,
	/** The main screen title. */
	title: PropTypes.string.isRequired,
	/** The main screen body text. */
	mainBodyText: PropTypes.oneOfType( [ PropTypes.string, PropTypes.object ] ).isRequired,
};

ScreenMain.defaultProps = {
	isMigrating: false,
	isStartingFresh: false,
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
