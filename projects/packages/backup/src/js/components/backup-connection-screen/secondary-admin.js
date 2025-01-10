import { JetpackVaultPressBackupLogo } from '@automattic/jetpack-components';
import { ConnectScreen } from '@automattic/jetpack-connection';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { STORE_ID } from '../../store';
import connectImage from './assets/connect-backup.png';

export const BackupSecondaryAdminConnectionScreen = () => {
	const APINonce = useSelect( select => select( STORE_ID ).getAPINonce(), [] );
	const APIRoot = useSelect( select => select( STORE_ID ).getAPIRoot(), [] );
	const registrationNonce = useSelect( select => select( STORE_ID ).getRegistrationNonce(), [] );

	return (
		<ConnectScreen
			title={ __( 'Save every change and get back online quickly', 'jetpack-backup-pkg' ) }
			buttonLabel={ __( 'Log in to continue', 'jetpack-backup-pkg' ) }
			apiRoot={ APIRoot }
			apiNonce={ APINonce }
			registrationNonce={ registrationNonce }
			images={ [ connectImage ] }
			from="jetpack-backup"
			redirectUri="admin.php?page=jetpack-backup"
			logo={ <JetpackVaultPressBackupLogo /> }
		>
			<p>
				It looks like your site already has a backup plan activated. All you need to do is log in
				with your WordPress account.
			</p>
		</ConnectScreen>
	);
};
