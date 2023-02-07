import restApi from '@automattic/jetpack-api';
import { AdminPage, AdminSectionHero, Container, Col } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import React, { useEffect, useState } from 'react';
import { Migration, MigrationProgress } from '../migration';

const Admin = () => {
	const { apiNonce, apiRoot, registrationNonce } = window.jetpackMigrationInitialState;
	const [ migrationState, setMigrationState ] = useState( {} );
	const [ migrationStatus, setMigrationStatus ] = useState( 'inactive' );

	useEffect( () => configureApi(), [ apiRoot, apiNonce ] );
	useEffect( () => checkMigrationStatus(), [] );

	const configureApi = () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	};

	const checkMigrationStatus = () => {
		restApi.fetchMigrationStatus().then( state => {
			setMigrationState( state );
			setMigrationStatus( state?.status );
		} );
	};

	return (
		<AdminPage
			moduleName={ __( `Move to WordPress.com`, 'jetpack-migration' ) }
			showBackground={ false }
			showHeader={ false }
			showFooter={ false }
		>
			<AdminSectionHero>
				<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
					<Col sm={ 4 } md={ 8 } lg={ 12 }>
						{ migrationStatus === 'inactive' ? (
							<Migration
								apiRoot={ apiRoot }
								apiNonce={ apiNonce }
								registrationNonce={ registrationNonce }
							/>
						) : (
							<MigrationProgress apiRoot={ apiRoot } apiNonce={ apiNonce } />
						) }
					</Col>
				</Container>
			</AdminSectionHero>
		</AdminPage>
	);
};

export default Admin;
