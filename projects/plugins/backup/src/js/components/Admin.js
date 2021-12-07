/**
 * External dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useSelect } from '@wordpress/data';
import { JetpackFooter, JetpackLogo, getRedirectUrl } from '@automattic/jetpack-components';

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
	const [ siteProducts, setSiteProducts ] = useState( [] );
	const [ siteProductsError, setSiteProductsError ] = useState( null );
	const [ siteProductsLoaded, setSiteProductsLoaded ] = useState( false );

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

	useEffect( () => {
		apiFetch( { path: '/jetpack/v4/site/products' } ).then(
			res => {
				setSiteProducts( JSON.parse( res.data )[ 0 ] );
				setSiteProductsLoaded( true );
			},
			() => {
				setSiteProductsLoaded( true );
				setSiteProductsError( 'Failed to fetch site products' );
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
			<div className="jp-wrap">
				<div className="jp-row">
					<div class="lg-col-span-8 md-col-span-8 sm-col-span-4">
						<h1>{ __( 'Your site does not have backups', 'jetpack-backup' ) }</h1>
						<p>
							{ __(
								'Get peace of mind knowing your work will be saved, add backups today.',
								'jetpack-backup'
							) }
						</p>
						<a
							className="button"
							href={ getRedirectUrl( 'backup-plugin-upgrade-10gb', { site: domain } ) }
							target="_blank"
							rel="noreferrer"
						>
							{ __( 'Upgrade now', 'jetpack-backup' ) }
						</a>
					</div>
					<div className="lg-col-span-4 md-col-span-0 sm-col-span-0"></div>
				</div>
			</div>
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
				<div className="jp-wrap">
					<div className="jp-row">
						<div className="lg-col-span-12 md-col-span-8 sm-col-span-4">
							{ renderConnectScreen() }
						</div>
					</div>
				</div>
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
			return <div>{ capabilitiesError }</div>;
		}

		return renderNoBackupCapabilities();
	};

	const renderHeader = () => {
		if ( showHeaderFooter ) {
			return (
				<div className="jp-wrap">
					<div className="jp-row">
						<div class="lg-col-span-12 md-col-span-8 sm-col-span-4">
							<div className="jp-masthead">
								<div className="jp-masthead__inside-container">
									<div className="jp-masthead__logo-container">
										<JetpackLogo className="jetpack-logo__masthead" />
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			);
		}
	};

	const renderFooter = () => {
		if ( showHeaderFooter ) {
			return (
				<div className="jp-wrap">
					<div className="jp-row">
						<div className="lg-col-span-12 md-col-span-8 sm-col-span-4">
							<JetpackFooter
								moduleName={ __( 'Jetpack Backup', 'jetpack-backup' ) }
								a8cLogoHref="https://www.jetpack.com"
							/>
						</div>
					</div>
				</div>
			);
		}
	};

	const renderMyPlan = () => {
		return (
			<div className="jpb-my-plan-container">
				<h3>{ __( 'My Plan', 'jetpack-backup' ) }</h3>
				<p>{ __( 'The extra power you added to your Jetpack.', 'jetpack-backup' ) }</p>
				{ siteProductsError && <div>{ siteProductsError }</div> }
				{ siteProductsLoaded && ! siteProductsError && (
					<>
						<h4> { siteProducts.product_name } </h4>
						<p> { siteProducts.expiry_message } </p>
					</>
				) }
				<p>
					<a
						href={ getRedirectUrl( 'backup-plugin-my-plan', { site: domain } ) }
						target="_blank"
						rel="noreferrer"
					>
						{ __( 'Manage your plan', 'jetpack-backup' ) }
					</a>
				</p>
			</div>
		);
	};

	// Renders additional segments under the jp-hero area condition on having a backup plan
	const renderBackupSegments = () => {
		return (
			<div className="jp-row">
				<div className="lg-col-span-6 md-col-span-4 sm-col-span-4">
					<h2>{ __( 'Your cloud backups', 'jetpack-backup' ) }</h2>
					<p>
						{ __(
							'All the backups are safely stored in the cloud and available for you at any time on Jetpack.com, with full details about status and content.',
							'jetpack-backup'
						) }
					</p>
					{ hasBackupPlan() &&
						( (
							<p>
								<a
									href={ getRedirectUrl( 'jetpack-backup', { site: domain } ) }
									target="_blank"
									rel="noreferrer"
								>
									{ __( 'See all your backups', 'jetpack-backup' ) }
								</a>
							</p>
						 ),
						renderMyPlan() ) }
				</div>
				<div className="lg-col-span-1 md-col-span-1 sm-col-span-0"></div>
				<div className="lg-col-span-5 md-col-span-3 sm-col-span-4">
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
				</div>
			</div>
		);
	};

	const renderContent = () => {
		return (
			<div className="content">
				<div className="jp-hero">{ renderLoadedState() }</div>
				<div className="jp-section">
					<div className="jp-wrap">{ isFullyConnected() && renderBackupSegments() }</div>
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
