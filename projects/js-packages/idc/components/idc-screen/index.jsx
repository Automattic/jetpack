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

/**
 * The IDC screen component.
 *
 * @param {object} props - The properties.
 * @returns {React.Component} The `ConnectScreen` component.
 */
const IDCScreen = props => {
	const {
		logo,
		headerText,
		wpcomHomeUrl,
		currentUrl,
		apiNonce,
		apiRoot,
		redirectUri,
		tracksUserData,
		tracksEventData,
	} = props;

	const [ isMigrated, setIsMigrated ] = useState( false );

	const onMigrated = useCallback( () => {
		setIsMigrated( true );
	}, [ setIsMigrated ] );

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

	const [ isFinishingMigration, setIsFinishingMigration ] = useState( false );

	/**
	 * Handle the "Got It" click after the migration has completed.
	 */
	const finishMigration = useCallback( () => {
		if ( ! isFinishingMigration ) {
			setIsFinishingMigration( true );
			window.location.reload();
		}
	}, [ isFinishingMigration, setIsFinishingMigration ] );

	return (
		<IDCScreenVisual
			logo={ logo }
			headerText={ headerText }
			wpcomHomeUrl={ wpcomHomeUrl }
			currentUrl={ currentUrl }
			redirectUri={ redirectUri }
			isMigrated={ isMigrated }
			onMigrated={ onMigrated }
			finishCallback={ finishMigration }
			isFinishing={ isFinishingMigration }
		/>
	);
};

IDCScreen.propTypes = {
	/** The screen logo. */
	logo: PropTypes.object,
	/** The header text. */
	headerText: PropTypes.string,
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

export default IDCScreen;
