/**
 * External dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useSelect } from '@wordpress/data';
import {
	AdminPage,
	AdminSection,
	AdminSectionHero,
	Row,
	Col,
	getRedirectUrl,
} from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import Backups from './Backups';
import useConnection from '../hooks/useConnection';
import './admin-style.scss';
import './masthead/masthead-style.scss';
import { STORE_ID } from '../store';

/* eslint react/react-in-jsx-scope: 0 */
const Admin = () => {
	const [ connectionStatus, renderConnectScreen, renderConnectionStatusCard ] = useConnection();
	const [ capabilities, setCapabilities ] = useState( [] );
	const [ capabilitiesError, setCapabilitiesError ] = useState( null );
	const [ connectionLoaded, setConnectionLoaded ] = useState( false );
	const [ capabilitiesLoaded, setCapabilitiesLoaded ] = useState( false );
	const [ showHeaderFooter, setShowHeaderFooter ] = useState( true );

	const domain = useSelect( select => select( STORE_ID ).getCalypsoSlug(), [] );

	useEffect( () => {
		if ( 0 < Object.keys( connectionStatus ).length ) {
			setConnectionLoaded( true );
		}
	}, [ connectionStatus ] );

	useEffect( () => {
		apiFetch( { path: 'jetpack/v4/backup-capabilities' } ).then(
			res => {
				setCapabilities( res.capabilities );
				setCapabilitiesLoaded( true );
			},
			() => {
				setCapabilitiesLoaded( true );
				setCapabilitiesError( 'Failed to fetch site capabilities' );
			}
		);
	}, [] );

	const isFullyConnected = () => {
		return connectionLoaded && connectionStatus.isUserConnected && connectionStatus.isRegistered;
	};

	const hasBackupPlan = () => {
		return capabilities.includes( 'backup' );
	};

	const renderNoBackupCapabilities = () => {
		return (
			<Row>
				<Col lg={ 8 } md={ 8 } sm={ 4 }>
					<h1>{ __( 'Your site does not have backups', 'jetpack-backup' ) }</h1>
					<p>
						{ __(
							'Get peace of mind knowing your work will be saved, add backups today.',
							'jetpack-backup'
						) }
					</p>
					<a
						class="button"
						href={ getRedirectUrl( 'backup-plugin-upgrade-10gb', { site: domain } ) }
						target="_blank"
						rel="noreferrer"
					>
						{ __( 'Upgrade now', 'jetpack-backup' ) }
					</a>
				</Col>
				<Col lg={ 4 } md={ 0 } sm={ 0 } />
			</Row>
		);
	};

	const renderLoadedState = () => {
		if (
			! connectionLoaded ||
			! connectionStatus.isUserConnected ||
			! connectionStatus.isRegistered
		) {
			if ( showHeaderFooter ) {
				setShowHeaderFooter( false );
			}

			return (
				<Row>
					<Col lg={ 12 } md={ 8 } sm={ 4 }>
						{ renderConnectScreen() }
					</Col>
				</Row>
			);
		}

		// Show header and footer on all screens except ConnectScreen
		if ( ! showHeaderFooter ) {
			setShowHeaderFooter( true );
		}

		if ( ! capabilitiesLoaded ) {
			return <div></div>;
		}

		if ( hasBackupPlan() ) {
			return <Backups />;
		}

		// Render an error state, this shouldn't occurr since we've passed userConnected checks
		if ( capabilitiesError ) {
			return (
				<Row>
					<Col lg={ 12 } md={ 8 } sm={ 4 }>
						{ capabilitiesError }
					</Col>
				</Row>
			);
		}

		return renderNoBackupCapabilities();
	};

	// Renders additional segments under the jp-hero area condition on having a backup plan
	const renderBackupSegments = () => {
		return (
			<Row>
				<Col lg={ 6 } md={ 4 }>
					<h2>{ __( 'Where are my backups stored?', 'jetpack-backup' ) }</h2>
					<p>
						{ __(
							'All the backups are safely stored in the cloud and available for you at any time on Jetpack.com, with full details about status and content.',
							'jetpack-backup'
						) }
					</p>
					{ hasBackupPlan() && ! capabilities.includes( 'backup-realtime' ) && (
						<a
							class="jp-cut"
							href={ getRedirectUrl( 'backup-plugin-realtime-upgrade', { site: domain } ) }
						>
							<span>
								{ __(
									'Your site is updated with new content several times a day',
									'jetpack-backup'
								) }
							</span>
							<span>{ __( 'Consider upgrading to real-time protection', 'jetpack-backup' ) }</span>
						</a>
					) }
				</Col>
				<Col lg={ 1 } md={ 1 } sm={ 0 } />
				<Col lg={ 5 } md={ 3 } sm={ 4 }>
					<h2>{ __( "Your site's heartbeat", 'jetpack-backup' ) }</h2>
					<p>
						{ __(
							'The activity log lets you see everything that’s going on with your site outlined in an organized, readable way.',
							'jetpack-backup'
						) }
					</p>
					{ hasBackupPlan() && (
						<p>
							<a
								href={ getRedirectUrl( 'backup-plugin-activity-log', { site: domain } ) }
								target="_blank"
								rel="noreferrer"
							>
								{ __( "See your site's activity", 'jetpack-backup' ) }
							</a>
						</p>
					) }

					{ renderConnectionStatusCard() }
				</Col>
			</Row>
		);
	};

	const renderContent = () => {
		return (
			<div className="content">
				<AdminSectionHero>{ renderLoadedState() }</AdminSectionHero>
				<AdminSection>{ isFullyConnected() && renderBackupSegments() }</AdminSection>
			</div>
		);
	};

	return (
		<AdminPage
			withHeader={ showHeaderFooter }
			withFooter={ showHeaderFooter }
			moduleName={ __( 'Jetpack Backup', 'jetpack-backup' ) }
			a8cLogoHref="https://www.jetpack.com"
		>
			<div id="jetpack-backup-admin-container" className="jp-content">
				{ renderContent() }
			</div>
		</AdminPage>
	);
};

export default Admin;
