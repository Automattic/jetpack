/**
 * External dependencies
 */
import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import analytics from '@automattic/jetpack-analytics';
import restApi from '@automattic/jetpack-api';

/**
 * Internal dependencies
 */
import IDCScreenVisual from './visual';
import trackAndBumpMCStats from '../../tools/tracking';
import useMigration from '../../hooks/use-migration';
import useMigrationFinished from '../../hooks/use-migration-finished';
import useStartFresh from '../../hooks/use-start-fresh';
import customContentShape from '../../tools/custom-content-shape';

/**
 * The IDC screen component.
 *
 * @param {object} props - The properties.
 * @returns {React.Component} The `ConnectScreen` component.
 */
const IDCScreen = props => {
	const {
		logo,
		customContent,
		wpcomHomeUrl,
		currentUrl,
		apiNonce,
		apiRoot,
		redirectUri,
		tracksUserData,
		tracksEventData,
	} = props;

	const [ isMigrated, setIsMigrated ] = useState( false );

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

		if (
			tracksUserData &&
			tracksUserData.hasOwnProperty( 'userid' ) &&
			tracksUserData.hasOwnProperty( 'username' )
		) {
			analytics.initialize( tracksUserData.userid, tracksUserData.username );
		}

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
};

IDCScreen.defaultProps = {
	customContent: {},
};

export default IDCScreen;
