/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';
import { AdminPage, AdminSectionHero, Container, Col } from '@automattic/jetpack-components';
import { useSelect, select as syncSelect, useDispatch } from '@wordpress/data';
import { ConnectScreen, CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import React, { useMemo, useCallback } from 'react';

/**
 * Internal dependencies
 */
import restApi from '@automattic/jetpack-api';
import { STORE_ID } from '../../store';
import styles from './styles.module.scss';

const ConnectionItem = props => {
	const { connections } = window.jetpackSocialInitialState;

	return props.connectionIds.map( connectionId => {
		const connection = connections[ props.provider ][ connectionId ];
		return (
			<div key={ connectionId }>
				<tr>
					<th className={ styles.connectionRow }> { __( 'Name', 'jetpack-social' ) }</th>
					<th className={ styles.connectionRow }>{ __( 'Image', 'jetpack-social' ) }</th>
				</tr>
				<tr>
					<td className={ styles.connectionRow }>{ connection.external_display }</td>
					<td className={ styles.connectionRow }>
						{ connection.profile_picture && (
							<img
								alt="connection avatar"
								src={ connection.profile_picture }
								height="50px"
								width="50px"
							/>
						) }
					</td>
				</tr>
			</div>
		);
	} );
};

const ConnectionItems = () => {
	const { connections } = window.jetpackSocialInitialState;

	if ( ! connections ) {
		return null;
	}

	const providers = Object.keys( connections );
	return providers.map( provider => {
		return (
			<div key={ provider }>
				<h2> { provider.charAt( 0 ).toUpperCase() + provider.slice( 1 ) } Connections</h2>
				<table className={ styles.connectionTable }>
					<ConnectionItem
						connectionIds={ Object.keys( connections[ provider ] ) }
						provider={ provider }
					/>
				</table>
			</div>
		);
	} );
};

const ModuleToggle = () => {
	const updateOptions = useDispatch( STORE_ID ).updateJetpackSettings;
	const isModuleEnabled = useSelect( select => select( STORE_ID ).isModuleEnabled() );
	const isUpdating = useSelect( select => select( STORE_ID ).isUpdatingJetpackSettings() );

	const toggleModule = useCallback( () => {
		const newOption = {
			publicize_active: ! isModuleEnabled,
		};
		updateOptions( newOption );
	}, [ isModuleEnabled, updateOptions ] );

	const label = isModuleEnabled
		? __( 'Jetpack Social is active', 'jetpack-social' )
		: __( 'Jetpack Social is inactive', 'jetpack-social' );

	return (
		<ToggleControl
			label={ __( 'Activate Jetpack Social', 'jetpack-social' ) }
			help={ isUpdating ? __( 'Updating…', 'jetpack-social' ) : label }
			disabled={ isUpdating }
			checked={ isModuleEnabled }
			onChange={ toggleModule }
		/>
	);
};

const Admin = () => {
	useMemo( () => {
		const apiRootUrl = syncSelect( STORE_ID ).getAPIRootUrl();
		const apiNonce = syncSelect( STORE_ID ).getAPINonce();
		apiRootUrl && restApi.setApiRoot( apiRootUrl );
		apiNonce && restApi.setApiNonce( apiNonce );
	}, [] );

	const connectionStatus = useSelect(
		select => select( CONNECTION_STORE_ID ).getConnectionStatus(),
		[]
	);
	const { isUserConnected, isRegistered } = connectionStatus;
	const showConnectionCard = ! isRegistered || ! isUserConnected;

	return (
		<AdminPage moduleName={ __( 'Jetpack Social', 'jetpack-social' ) }>
			<AdminSectionHero>
				<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
					<Col sm={ 4 } md={ 8 } lg={ 12 }>
						{ showConnectionCard ? (
							<ConnectionSection />
						) : (
							<div className={ styles.publicizeConnectionsList }>
								<ModuleToggle />
								<ConnectionItems />
							</div>
						) }
					</Col>
				</Container>
			</AdminSectionHero>
		</AdminPage>
	);
};

export default Admin;

const ConnectionSection = () => {
	const { apiNonce, apiRoot, registrationNonce } = window.jetpackSocialInitialState;

	return (
		<ConnectScreen
			buttonLabel={ __( 'Connect Jetpack Social', 'jetpack-social' ) }
			pricingTitle={ __( 'Jetpack Social', 'jetpack-social' ) }
			title={ __( 'Social Media Automation for WordPress Sites', 'jetpack-social' ) }
			apiRoot={ apiRoot }
			apiNonce={ apiNonce }
			registrationNonce={ registrationNonce }
			from="jetpack-social"
			redirectUri="admin.php?page=jetpack-social"
		>
			<h3>
				{ __(
					'Share your site’s posts on several social media networks automatically when you publish a new post',
					'jetpack-social'
				) }
			</h3>
			<ul>
				<li>
					{ __(
						'Reach your maximum potential audience, not just those who visit your site',
						'jetpack-social'
					) }
				</li>
				<li>
					{ __(
						'Be found by prospective readers or customers on their preferred social site or network',
						'jetpack-social'
					) }
				</li>
				<li>
					{ __(
						'Allow people who like your content to easily share it with their own followers, giving you even greater visibility',
						'jetpack-social'
					) }
				</li>
			</ul>
		</ConnectScreen>
	);
};
