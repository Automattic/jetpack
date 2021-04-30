/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useConnection from '../hooks/useConnection';
import './style.scss';

const Admin = () => {
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
		<div id="jetpack-backup-admin-container" className="wrap">
			<h1>Jetpack Backup Plugin</h1>
			{ ! isUserConnected && renderPromptForConnection() }
			{ isUserConnected && isRegistered && (
				<p className="notice notice-success">
					{ __(
						'Site and User Connected. Todo: Show Backup plugin centric data :)',
						'jetpack-backup'
					) }
				</p>
			) }
		</div>
	);
};

export default Admin;
