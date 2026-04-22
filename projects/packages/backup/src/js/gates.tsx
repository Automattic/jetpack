/* eslint-disable jsdoc/require-param-description, jsdoc/require-returns */

import { Col, Container, LoadingPlaceholder } from '@automattic/jetpack-components';
import { ConnectionError, useConnectionErrorNotice } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import {
	useIsFullyConnected,
	useIsSecondaryAdminNotConnected,
	useSiteHasBackupProduct,
} from './components/Admin/hooks';
import NoBackupCapabilities from './components/Admin/no-backup-capabilities';
import { BackupConnectionScreen } from './components/backup-connection-screen';
import { BackupSecondaryAdminConnectionScreen } from './components/backup-connection-screen/secondary-admin';
import { isMockMode } from './data/mock';
import useCapabilities from './hooks/useCapabilities';
import useConnection from './hooks/useConnection';
import type { FC, ReactNode } from 'react';

/**
 * Gate screen — wraps the Overview and only renders `children` when the
 * site is fully connected, the user has a backup plan, and capabilities
 * have loaded. Until then (or if any check fails) it renders an
 * appropriate fallback screen.
 * @param root0
 * @param root0.children
 */
const Gates: FC< { children: ReactNode } > = ( { children } ) => {
	const connectionStatus = useConnection();
	const { hasConnectionError } = useConnectionErrorNotice();
	const isFullyConnected = useIsFullyConnected();
	const secondaryAdminNotConnected = useIsSecondaryAdminNotConnected();
	const { siteHasBackupProduct, isLoadingBackupProduct } = useSiteHasBackupProduct();
	const { capabilities, capabilitiesError, capabilitiesLoaded, hasBackupPlan } =
		useCapabilities() as {
			capabilities: string[] | null;
			capabilitiesError: string | null;
			capabilitiesLoaded: boolean;
			hasBackupPlan: boolean;
		};

	// `?jpb-mock=1` short-circuits every gate so the Overview renders
	// immediately, even on sites without a Jetpack connection or a
	// backup plan. Useful for local design iteration on JT/Docker.
	if ( isMockMode() ) {
		return <>{ children }</>;
	}

	const connectionLoaded = Object.keys( connectionStatus ).length > 0;

	const connectionBanner = hasConnectionError ? (
		<Col className="jetpack-connection-verified-error">
			<ConnectionError />
		</Col>
	) : null;

	// Secondary admin: user is on a fully-connected site but isn't themselves
	// linked. If the site has a backup product we ask them to connect;
	// otherwise fall through to the regular flow (which will show the main
	// connection screen or capabilities error).
	if ( secondaryAdminNotConnected ) {
		if ( isLoadingBackupProduct ) {
			return (
				<Container horizontalSpacing={ 8 } horizontalGap={ 0 }>
					<Col>
						<LoadingPlaceholder width="100%" height={ 500 } />
					</Col>
				</Container>
			);
		}

		if ( siteHasBackupProduct ) {
			return (
				<Container horizontalSpacing={ 8 } horizontalGap={ 0 }>
					<Col>
						<BackupSecondaryAdminConnectionScreen />
					</Col>
				</Container>
			);
		}
	}

	if ( ! connectionLoaded ) {
		return (
			<Container horizontalSpacing={ 5 } fluid>
				<Col>
					<LoadingPlaceholder width="100%" height={ 500 } />
				</Col>
			</Container>
		);
	}

	if ( ! isFullyConnected ) {
		return (
			<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
				{ connectionBanner }
				<Col lg={ 12 } md={ 8 } sm={ 4 }>
					<BackupConnectionScreen />
				</Col>
			</Container>
		);
	}

	if ( ! capabilitiesLoaded ) {
		return (
			<Container horizontalSpacing={ 5 } fluid>
				{ connectionBanner }
				<Col>
					<LoadingPlaceholder width="100%" height={ 500 } />
				</Col>
			</Container>
		);
	}

	if ( hasBackupPlan ) {
		return (
			<>
				{ connectionBanner }
				{ children }
			</>
		);
	}

	if ( capabilitiesError === 'is_unlinked' ) {
		return (
			<Container horizontalSpacing={ 3 }>
				<Col lg={ 12 } md={ 8 } sm={ 4 }>
					<h2>
						{ __(
							"Site backups are managed by the owner of this site's Jetpack connection.",
							'jetpack-backup-pkg'
						) }
					</h2>
				</Col>
			</Container>
		);
	}

	if ( capabilitiesError === 'fetch_capabilities_failed' ) {
		return (
			<Container horizontalSpacing={ 3 }>
				<Col lg={ 12 } md={ 8 } sm={ 4 }>
					<h2>{ __( 'Failed to fetch site capabilities', 'jetpack-backup-pkg' ) }</h2>
				</Col>
			</Container>
		);
	}

	if ( Array.isArray( capabilities ) && capabilities.length === 0 ) {
		return <NoBackupCapabilities />;
	}

	return null;
};

export default Gates;
