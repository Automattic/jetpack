import { ActionButton, getRedirectUrl } from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow, useConnection } from '@automattic/jetpack-connection';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
import backupVideoThumbnail from './images/jetpack-backup-video-thumbnail.png';

import './style.scss';

const BackupVideoSection = ( {
	siteProductAvailabilityHandler,
	apiRoot,
	apiNonce,
	registrationNonce,
} ) => {
	const { run: handleCheckoutWorkflow, hasCheckoutStarted } = useProductCheckoutWorkflow( {
		productSlug: 'jetpack_backup_t1_yearly',
		redirectUrl: 'admin.php?page=jetpack-backup',
		siteProductAvailabilityHandler,
		from: 'jetpack-backup',
	} );

	const { siteIsRegistering, userIsConnecting, isOfflineMode, registrationError } = useConnection( {
		registrationNonce: registrationNonce,
		redirectUri: 'admin.php?page=jetpack-backup',
		apiRoot: apiRoot,
		apiNonce: apiNonce,
		autoTrigger: false,
		from: 'jetpack-backup',
	} );

	const errorMessage = isOfflineMode
		? createInterpolateElement( __( 'Unavailable in <a>Offline Mode</a>', 'jetpack-backup-pkg' ), {
				a: (
					<a
						href={ getRedirectUrl( 'jetpack-support-development-mode' ) }
						target="_blank"
						rel="noopener noreferrer"
					/>
				),
		  } )
		: undefined;

	const buttonIsLoading = siteIsRegistering || userIsConnecting || hasCheckoutStarted;
	const displayButtonError = Boolean( registrationError );

	return (
		<div className="jp-backup-video-section">
			<div className="jp-backup-video-section__content">
				<h2>{ __( 'Take a walkthrough of VaultPress Backup', 'jetpack-backup-pkg' ) }</h2>

				<p>
					{ __(
						'Save every change and get back online quickly with one-click restores.',
						'jetpack-backup-pkg'
					) }
				</p>

				<ActionButton
					label={ __( 'Get VaultPress Backup', 'jetpack-backup-pkg' ) }
					onClick={ handleCheckoutWorkflow }
					displayError={ displayButtonError }
					errorMessage={ errorMessage }
					isLoading={ buttonIsLoading }
					isDisabled={ isOfflineMode }
				/>
			</div>

			<video poster={ backupVideoThumbnail } controls>
				<source
					src="https://videos.files.wordpress.com/VNRR7Mkj/audio_jetpack_backup_-3.mov"
					type="video/mp4"
				/>
			</video>
		</div>
	);
};

export { BackupVideoSection };
