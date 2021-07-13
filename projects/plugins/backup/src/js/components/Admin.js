/**
 * External dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Backups from './Backups';
import useConnection from '../hooks/useConnection';
import './admin-style.scss';
import { STORE_ID } from '../store';

/* global wp */
/* eslint react/react-in-jsx-scope: 0 */
const Admin = () => {
	const [ connectionStatus, renderJetpackConnection ] = useConnection();
	const [ capabilities, setCapabilities ] = wp.element.useState( null );
	const [ capabilitiesError, setCapabilitiesError ] = wp.element.useState( null );
	const [ connectionLoaded, setConnectionLoaded ] = wp.element.useState( false );
	const [ capabilitiesLoaded, setCapabilitiesLoaded ] = wp.element.useState( false );

	const domain = useSelect( select => select( STORE_ID ).getCalypsoSlug(), [] );

	wp.element.useEffect( () => {
		if ( 0 < Object.keys( connectionStatus ).length ) {
			setConnectionLoaded( true );
		}
	}, [ connectionStatus ] );

	wp.element.useEffect( () => {
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

	const renderPromptForConnection = () => {
		return (
			<Fragment>
				<p className="notice notice-error">
					{ __(
						'Jetpack Backup requires a user connection to WordPress.com to be able to backup your website.',
						'jetpack-backup'
					) }
				</p>
				{ renderJetpackConnection() }
			</Fragment>
		);
	};

	const renderLoadedState = () => {
		// Loading state
		if ( ! connectionLoaded ) {
			return renderJetpackConnection();
		}

		if ( ! capabilitiesLoaded ) {
			return <div></div>;
		}

		if ( ! connectionStatus.isUserConnected || ! connectionStatus.isRegistered ) {
			return renderPromptForConnection();
		}

		// Has backup
		if ( capabilities !== null && capabilities.includes( 'backup' ) ) {
			return <Backups />;
		}

		// Render an error state, this shouldn't occurr since we've passed userConnected checks
		if ( capabilitiesError ) {
			return <div>{ capabilitiesError }</div>;
		}

		return <div>No Backup Capabilities</div>;
	};

	const renderHeader = () => {
		// TODO: Integrate Jetpack Header
		return (
			<div className="jp-header">
				<h1>Jetpack Backup Plugin - Placeholder Header</h1>
			</div>
		);
	};

	const renderFooter = () => {
		// TODO: Integrate Jetpack Footer
		return <div className="jp-footer">Jetpack Backup 1.0 - Placeholder Footer</div>;
	};

	const renderManageConnection = () => {
		// TODO: Integrate connection management from Connection Package
		return (
			<Fragment>
				<h2>{ __( 'Manage your connection', 'jetpack-backup' ) }</h2>
				<p className="notice notice-success">
					{ __( 'Site and User Connected.', 'jetpack-backup' ) }
				</p>
			</Fragment>
		);
	};

	const renderContent = () => {
		return (
			<div className="content">
				<div>
					<div className="jp-hero">{ renderLoadedState() }</div>
					<div className="jp-section">
						<div className="jp-wrap">
							<div className="jp-row">
								<div class="lg-col-span-6 md-col-span-4 sm-col-span-4">
									<h2>{ __( 'Where are my backups stored?', 'jetpack-backup' ) }</h2>
									<p>
										{ __(
											'All the backups are safely stored in the cloud and available for you at any time on Jetpack.com, with full details about status and content.',
											'jetpack-backup'
										) }
									</p>
									{ capabilities !== null && ! capabilities.includes( 'backup-realtime' ) && (
										<a
											class="jp-cut"
											href={
												'https://wordpress.com/checkout/' + domain + '/jetpack_backup_realtime'
											}
										>
											<span>
												{ __(
													'Your site is updated with new content several times a day',
													'jetpack-backup'
												) }
											</span>
											<span>
												{ __( 'Consider upgrading to real-time protection', 'jetpack-backup' ) }
											</span>
										</a>
									) }
								</div>
								<div class="lg-col-span-1 md-col-span-1 sm-col-span-0"></div>
								<div class="lg-col-span-5 md-col-span-3 sm-col-span-4">
									<h2>{ __( "Your site's heartbeat", 'jetpack-backup' ) }</h2>
									<p>
										{ __(
											'The activity log lets you see everything that’s going on with your site outlined in an organized, readable way.',
											'jetpack-backup'
										) }
									</p>
									<p>
										<a
											href={ 'https://cloud.jetpack.com/activity-log/' + domain }
											target="_blank"
											rel="noreferrer"
										>
											{ __( "See your site's activity", 'jetpack-backup' ) }
										</a>
									</p>
								</div>
							</div>
							{ connectionLoaded &&
								connectionStatus.isUserConnected &&
								connectionStatus.isRegistered && (
									<div className="jp-row">
										<div class="lg-col-span-6 md-col-span-4 sm-col-span-4"></div>
										<div class="lg-col-span-1 md-col-span-1 sm-col-span-0"></div>
										<div class="lg-col-span-5 md-col-span-3 sm-col-span-4">
											{ renderManageConnection() }
										</div>
									</div>
								) }
						</div>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div id="jetpack-backup-admin-container" className="jp-content">
			{ renderHeader() }
			{ renderContent() }
			{ renderFooter() }
		</div>
	);
};

export default Admin;
