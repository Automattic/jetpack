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
import ScreenNonAdmin from './screen-non-admin';
import ScreenMigrated from './screen-migrated';
import customContentShape from '../../tools/custom-content-shape';
import './style.scss';

const renderLogoImage = ( logo, alt ) =>
	typeof logo === 'string' || logo instanceof String ? (
		<img src={ logo } alt={ alt } className="jp-idc__idc-screen__logo-image" />
	) : (
		logo
	);

const IDCScreenVisual = props => {
	const {
		logo,
		customContent,
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
		isAdmin,
	} = props;

	const nonAdminBody = ! isAdmin ? <ScreenNonAdmin customContent={ customContent } /> : '';

	let adminBody = '';

	const headerText = customContent.headerText || __( 'Safe Mode', 'jetpack' );

	if ( isAdmin ) {
		adminBody = isMigrated ? (
			<ScreenMigrated
				wpcomHomeUrl={ wpcomHomeUrl }
				currentUrl={ currentUrl }
				finishCallback={ finishMigrationCallback }
				isFinishing={ isFinishingMigration }
				customContent={ customContent }
			/>
		) : (
			<ScreenMain
				wpcomHomeUrl={ wpcomHomeUrl }
				currentUrl={ currentUrl }
				redirectUri={ redirectUri }
				customContent={ customContent }
				isMigrating={ isMigrating }
				migrateCallback={ migrateCallback }
				isStartingFresh={ isStartingFresh }
				startFreshCallback={ startFreshCallback }
			/>
		);
	}

	return (
		<div className={ 'jp-idc__idc-screen' + ( isMigrated ? ' jp-idc__idc-screen__success' : '' ) }>
			<div className="jp-idc__idc-screen__header">
				<div className="jp-idc__idc-screen__logo">{ renderLogoImage( logo, headerText ) }</div>
				<div className="jp-idc__idc-screen__logo-label">{ headerText }</div>
			</div>

			{ nonAdminBody }

			{ adminBody }
		</div>
	);
};

IDCScreenVisual.propTypes = {
	/** The screen logo, Jetpack by default. */
	logo: PropTypes.object.isRequired,
	/** Custom text content. */
	customContent: PropTypes.shape( customContentShape ),
	/** The original site URL. */
	wpcomHomeUrl: PropTypes.string.isRequired,
	/** The current site URL. */
	currentUrl: PropTypes.string.isRequired,
	/** The redirect URI to redirect users back to after connecting. */
	redirectUri: PropTypes.string.isRequired,
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
	/** Whether to display the "admin" or "non-admin" screen. */
	isAdmin: PropTypes.bool.isRequired,
};

IDCScreenVisual.defaultProps = {
	logo: <JetpackLogo height={ 24 } />,
	isMigrated: false,
	isFinishingMigration: false,
	isMigrating: false,
	isStartingFresh: false,
	customContent: {},
};

export default IDCScreenVisual;
