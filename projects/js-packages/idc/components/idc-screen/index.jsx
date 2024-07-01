import restApi from '@automattic/jetpack-api';
import { useSelect } from '@wordpress/data';
import PropTypes from 'prop-types';
import React, { useEffect, useState, useCallback } from 'react';
import useMigration from '../../hooks/use-migration';
import useMigrationFinished from '../../hooks/use-migration-finished';
import useStartFresh from '../../hooks/use-start-fresh';
import { STORE_ID } from '../../state/store';
import customContentShape from '../../tools/custom-content-shape';
import trackAndBumpMCStats, { initializeAnalytics } from '../../tools/tracking';
import IDCScreenVisual from './visual';

/**
 * The IDC screen component.
 *
 * @param {object} props - The properties.
 * @returns {React.Component} The `ConnectScreen` component.
 */
const IDCScreen = props => {
	const {
		logo,
		customContent = {},
		wpcomHomeUrl,
		currentUrl,
		apiNonce,
		apiRoot,
		redirectUri,
		tracksUserData,
		tracksEventData,
		isAdmin,
		possibleDynamicSiteUrlDetected,
		isDevelopmentSite,
	} = props;

	const [ isMigrated, setIsMigrated ] = useState( false );

	const errorType = useSelect( select => select( STORE_ID ).getErrorType(), [] );

	const { isMigrating, migrateCallback } = useMigration(
		useCallback( () => {
			setIsMigrated( true );
		}, [ setIsMigrated ] )
	);

	const { isStartingFresh, startFreshCallback } = useStartFresh( redirectUri );
	const { isFinishingMigration, finishMigrationCallback } = useMigrationFinished();

	/**
	 * Initialize the REST API and analytics.
	 */
	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );

		initializeAnalytics( tracksEventData, tracksUserData );

		if ( tracksEventData ) {
			if ( tracksEventData.hasOwnProperty( 'isAdmin' ) && tracksEventData.isAdmin ) {
				trackAndBumpMCStats( 'notice_view' );
			} else {
				trackAndBumpMCStats( 'non_admin_notice_view', {
					page: tracksEventData.hasOwnProperty( 'currentScreen' )
						? tracksEventData.currentScreen
						: false,
				} );
			}
		}
	}, [ apiRoot, apiNonce, tracksUserData, tracksEventData ] );

	return (
		<IDCScreenVisual
			logo={ logo }
			customContent={ customContent }
			wpcomHomeUrl={ wpcomHomeUrl }
			currentUrl={ currentUrl }
			redirectUri={ redirectUri }
			isMigrating={ isMigrating }
			migrateCallback={ migrateCallback }
			isMigrated={ isMigrated }
			finishMigrationCallback={ finishMigrationCallback }
			isFinishingMigration={ isFinishingMigration }
			isStartingFresh={ isStartingFresh }
			startFreshCallback={ startFreshCallback }
			isAdmin={ isAdmin }
			hasStaySafeError={ errorType === 'safe-mode' }
			hasFreshError={ errorType === 'start-fresh' }
			hasMigrateError={ errorType === 'migrate' }
			possibleDynamicSiteUrlDetected={ possibleDynamicSiteUrlDetected }
			isDevelopmentSite={ isDevelopmentSite }
		/>
	);
};

IDCScreen.propTypes = {
	/** The screen logo. */
	logo: PropTypes.object,
	/** Custom text content. */
	customContent: PropTypes.shape( customContentShape ),
	/** The original site URL. */
	wpcomHomeUrl: PropTypes.string.isRequired,
	/** The current site URL. */
	currentUrl: PropTypes.string.isRequired,
	/** The redirect URI to redirect users back to after connecting. */
	redirectUri: PropTypes.string.isRequired,
	/** API root URL. */
	apiRoot: PropTypes.string.isRequired,
	/** API Nonce. */
	apiNonce: PropTypes.string.isRequired,
	/** WordPress.com user's Tracks identity. */
	tracksUserData: PropTypes.object,
	/** WordPress.com event tracking information. */
	tracksEventData: PropTypes.object,
	/** Whether to display the "admin" or "non-admin" screen. */
	isAdmin: PropTypes.bool.isRequired,
	/** If potentially dynamic HTTP_HOST usage was detected for site URLs in wp-config which can lead to a JP IDC. */
	possibleDynamicSiteUrlDetected: PropTypes.bool,
	/** Whether the site is in development mode. */
	isDevelopmentSite: PropTypes.bool,
};

export default IDCScreen;
