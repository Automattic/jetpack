/**
 * External dependencies
 */
import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import restApi from '@automattic/jetpack-api';
import { JetpackLogo } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import ScreenMain from './screen-main';
import ScreenMigrated from './screen-migrated';
import './style.scss';

/**
 * The IDC screen component.
 *
 * @param {object} props - The properties.
 * @param {React.Component} props.logo - The screen logo, Jetpack by default.
 * @param {string} props.headerText - The header text, 'Safe Mode' by default.
 * @param {string} props.wpcomHomeUrl - The original site URL.
 * @param {string} props.currentUrl - The current site URL.
 * @param {string} props.apiRoot - API root URL, required.
 * @param {string} props.apiNonce - API Nonce, required.
 * @returns {React.Component} The `ConnectScreen` component.
 */
const IDCScreen = props => {
	const { logo, headerText, wpcomHomeUrl, currentUrl, apiNonce, apiRoot } = props;

	const [ isMigrated, setIsMigrated ] = useState( false );

	const onMigrated = useCallback( () => {
		setIsMigrated( true );
	}, [ setIsMigrated ] );

	/**
	 * Initialize the REST API.
	 */
	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	return (
		<div className="jp-idc-screen-base">
			<div className="jp-idc-header">
				<div className="jp-idc-logo">{ logo }</div>
				<div className="jp-idc-logo-label">{ headerText }</div>
			</div>

			{ isMigrated ? (
				<ScreenMigrated wpcomHomeUrl={ wpcomHomeUrl } currentUrl={ currentUrl } />
			) : (
				<ScreenMain
					wpcomHomeUrl={ wpcomHomeUrl }
					currentUrl={ currentUrl }
					onMigrated={ onMigrated }
				/>
			) }
		</div>
	);
};

IDCScreen.propTypes = {
	logo: PropTypes.object.isRequired,
	headerText: PropTypes.string.isRequired,
	wpcomHomeUrl: PropTypes.string.isRequired,
	currentUrl: PropTypes.string.isRequired,
	apiRoot: PropTypes.string.isRequired,
	apiNonce: PropTypes.string.isRequired,
};

IDCScreen.defaultProps = {
	logo: <JetpackLogo height={ 24 } />,
	headerText: __( 'Safe Mode', 'jetpack' ),
};

export default IDCScreen;
