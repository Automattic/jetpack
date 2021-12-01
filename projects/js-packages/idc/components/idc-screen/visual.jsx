/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import { JetpackLogo } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import ScreenMain from './screen-main';
import ScreenMigrated from './screen-migrated';
import './style.scss';

const IDCScreenVisual = props => {
	const {
		logo,
		headerText,
		title,
		mainBodyText,
		wpcomHomeUrl,
		currentUrl,
		redirectUri,
		isMigrating,
		migrateCallback,
		isMigrated,
		finishMigrationCallback,
		isFinishingMigration,
		isStartingFresh,
		startFreshCallback,
	} = props;

	return (
		<div className={ 'jp-idc__idc-screen' + ( isMigrated ? ' jp-idc__idc-screen__success' : '' ) }>
			<div className="jp-idc__idc-screen__header">
				<div className="jp-idc__idc-screen__logo">{ logo }</div>
				<div className="jp-idc__idc-screen__logo-label">{ headerText }</div>
			</div>

			{ isMigrated ? (
				<ScreenMigrated
					wpcomHomeUrl={ wpcomHomeUrl }
					currentUrl={ currentUrl }
					finishCallback={ finishMigrationCallback }
					isFinishing={ isFinishingMigration }
				/>
			) : (
				<ScreenMain
					wpcomHomeUrl={ wpcomHomeUrl }
					currentUrl={ currentUrl }
					redirectUri={ redirectUri }
					title={ title }
					mainBodyText={ mainBodyText }
					isMigrating={ isMigrating }
					migrateCallback={ migrateCallback }
					isStartingFresh={ isStartingFresh }
					startFreshCallback={ startFreshCallback }
				/>
			) }
		</div>
	);
};

IDCScreenVisual.propTypes = {
	/** The screen logo, Jetpack by default. */
	logo: PropTypes.object,
	/** The header text, 'Safe Mode' by default. */
	headerText: PropTypes.string,
	/** The original site URL. */
	wpcomHomeUrl: PropTypes.string.isRequired,
	/** The current site URL. */
	currentUrl: PropTypes.string.isRequired,
	/** The redirect URI to redirect users back to after connecting. */
	redirectUri: PropTypes.string.isRequired,
	/** The main screen title. */
	title: PropTypes.string,
	/** The main screen body text. */
	mainBodyText: PropTypes.string,
	/** Whether the migration is in progress. */
	isMigrating: PropTypes.bool.isRequired,
	/** Migration callback. */
	migrateCallback: PropTypes.func,
	/** Whether the migration has been completed. */
	isMigrated: PropTypes.bool.isRequired,
	/** Callback to be called when migration is complete, and user clicks the OK button. */
	finishMigrationCallback: PropTypes.func,
	/** Whether the migration finishing process is in progress. */
	isFinishingMigration: PropTypes.bool.isRequired,
	/** Whether starting fresh is in progress. */
	isStartingFresh: PropTypes.bool.isRequired,
	/** "Start Fresh" callback. */
	startFreshCallback: PropTypes.func,
};

IDCScreenVisual.defaultProps = {
	logo: <JetpackLogo height={ 24 } />,
	headerText: __( 'Safe Mode', 'jetpack' ),
	isMigrated: false,
	isFinishingMigration: false,
	isMigrating: false,
	isStartingFresh: false,
};

export default IDCScreenVisual;
