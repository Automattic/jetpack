import { JetpackLogo } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
import customContentShape from '../../tools/custom-content-shape';
import ScreenMain from './screen-main';
import ScreenMigrated from './screen-migrated';
import ScreenNonAdmin from './screen-non-admin';
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
		hasMigrateError,
		hasFreshError,
		hasStaySafeError,
		possibleDynamicSiteUrlDetected,
	} = props;

	const nonAdminBody = ! isAdmin ? <ScreenNonAdmin customContent={ customContent } /> : '';

	let adminBody = '';

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
				hasMigrateError={ hasMigrateError }
				hasFreshError={ hasFreshError }
				hasStaySafeError={ hasStaySafeError }
				possibleDynamicSiteUrlDetected={ possibleDynamicSiteUrlDetected }
			/>
		);
	}

	return (
		<div className={ 'jp-idc__idc-screen' + ( isMigrated ? ' jp-idc__idc-screen__success' : '' ) }>
			<div className="jp-idc__idc-screen__header">
				<div className="jp-idc__idc-screen__logo">
					{ renderLogoImage( logo, customContent.logoAlt || '' ) }
				</div>
				<div className="jp-idc__idc-screen__logo-label">
					{ customContent.headerText
						? createInterpolateElement( customContent.headerText, {
								em: <em />,
								strong: <strong />,
						  } )
						: __( 'Safe Mode', 'jetpack' ) }
				</div>
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
	/** Whether the component encountered the migration error. */
	hasMigrateError: PropTypes.bool.isRequired,
	/** Whether the component encountered the "Fresh Connection" error. */
	hasFreshError: PropTypes.bool.isRequired,
	/** Whether the component encountered the "Stay in Safe Mode" error. */
	hasStaySafeError: PropTypes.bool.isRequired,
	/** If potentially dynamic HTTP_HOST usage was detected for site URLs in wp-config which can lead to a JP IDC. */
	possibleDynamicSiteUrlDetected: PropTypes.bool,
};

IDCScreenVisual.defaultProps = {
	logo: <JetpackLogo height={ 24 } />,
	isMigrated: false,
	isFinishingMigration: false,
	isMigrating: false,
	isStartingFresh: false,
	customContent: {},
	hasMigrateError: false,
	hasFreshError: false,
	hasStaySafeError: false,
	possibleDynamicSiteUrlDetected: false,
};

export default IDCScreenVisual;
