import restApi from '@automattic/jetpack-api';
import { AdminPage, AdminSectionHero, Container, Col } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import React, { useEffect, useCallback } from 'react';
import { useMigrationstatus } from '../hooks/use-migration-status';
import { Migration, MigrationError, MigrationLoading, MigrationProgress } from '../migration';

const Admin = () => {
	const sourceSiteSlug = window?.location?.host;
	const { apiNonce, apiRoot, registrationNonce } = window.wpcomMigrationInitialState;

	const configureApi = useCallback( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	useEffect( () => configureApi(), [ configureApi ] );
	const migrationStatus = useMigrationstatus( restApi );

	const renderContent = () => {
		if ( ! migrationStatus ) {
			return <MigrationLoading />;
		} else if ( migrationStatus.status === 'error' ) {
			return <MigrationError message={ migrationStatus.message } />;
		} else if ( migrationStatus.status === 'inactive' ) {
			return (
				<Migration
					apiRoot={ apiRoot }
					apiNonce={ apiNonce }
					registrationNonce={ registrationNonce }
					sourceSiteSlug={ sourceSiteSlug }
				/>
			);
		}
		return (
			<MigrationProgress
				apiRoot={ apiRoot }
				apiNonce={ apiNonce }
				sourceSiteSlug={ sourceSiteSlug }
			/>
		);
	};

	return (
		<AdminPage
			moduleName={ __( `Move to WordPress.com`, 'wpcom-migration' ) }
			showBackground={ false }
			showHeader={ false }
			showFooter={ false }
		>
			<AdminSectionHero>
				<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
					<Col sm={ 4 } md={ 8 } lg={ 12 }>
						{ renderContent() }
					</Col>
				</Container>
			</AdminSectionHero>
		</AdminPage>
	);
};

export default Admin;
