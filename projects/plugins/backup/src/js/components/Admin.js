/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import Backups from './Backups';
import { useSelect } from '@wordpress/data';
import { STORE_ID } from '../store';

/**
 * Internal dependencies
 */
import useConnection from '../hooks/useConnection';
import './admin-style.scss';

const Admin = () => {
	const APINonce = useSelect( select => select( STORE_ID ).getAPINonce(), [] );
	const APIRoot = useSelect( select => select( STORE_ID ).getAPIRoot(), [] );
	const [ { isUserConnected, isRegistered }, renderJetpackConnection ] = useConnection();
	const renderPromptForConnection = () => {
		return (
			<React.Fragment>
				<p className="notice notice-error">
					{ __(
						'Jetpack Backup requires a user connection to WordPress.com to be able to backup your website.',
						'jetpack-backup'
					) }
				</p>
				{ renderJetpackConnection() }
			</React.Fragment>
		);
	};

	return (
		<div id="jetpack-backup-admin-container" className="jp-content">
			<div className="jp-header">
				<h1>Jetpack Backup Plugin - Placeholder Header</h1>
			</div>
			<div className="content">
				{ ! isUserConnected && renderPromptForConnection() }
				{ isUserConnected && isRegistered && (
					<div>
						<div className="jp-hero">
							<Backups apiRoot={ APIRoot } apiNonce={ APINonce } />
						</div>
						<div className="jp-section">
							<div className="jp-wrap">
								<div className="jp-row">
									<div class="lg-col-span-6 md-col-span-4 sm-col-span-4">
										<h2>Where are my backups stored?</h2>
										<p>
											All the backups are safely stored in the cloud and available for you at any
											time on Jetpack.com, with full details about status and content.
										</p>
										<a class="jp-cut" href="#">
											<span>Your site is updated with new content several times a day</span>
											<span>Consider upgrading to real-time protection</span>
										</a>
									</div>
									<div class="lg-col-span-1 md-col-span-1 sm-col-span-0"></div>
									<div class="lg-col-span-5 md-col-span-3 sm-col-span-4">
										<h2>Your site’s heartbeat</h2>
										<p>
											The activity log lets you see everything that’s going on with your site
											outlined in an organized, readable way.
										</p>
										<p>
											<a href="#">See your site’s activity</a>
										</p>
									</div>
								</div>
								<div className="jp-row">
									<div class="lg-col-span-6 md-col-span-4 sm-col-span-4"></div>
									<div class="lg-col-span-1 md-col-span-1 sm-col-span-0"></div>
									<div class="lg-col-span-5 md-col-span-3 sm-col-span-4">
										<p className="notice notice-success">
											{ __( 'Site and User Connected.', 'jetpack-backup' ) }
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				) }
			</div>
			<div className="jp-footer">Jetpack Backup 1.0 - Placeholder Footer</div>
		</div>
	);
};

export default Admin;
