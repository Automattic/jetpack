import { JetpackVaultPressBackupLogo } from '@automattic/jetpack-components';
import {
	ConnectScreenRequiredPlan,
	ConnectScreen,
	CONNECTION_STORE_ID,
} from '@automattic/jetpack-connection';
import apiFetch from '@wordpress/api-fetch';
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React, { useCallback } from 'react';
import BackupPromotionBlock from '../components/backup-promotion';
import { BackupVideoSection } from '../components/backup-video-section';
import { STORE_ID } from '../store';
import connectImage from './assets/connect-backup.png';

/**
 * Expose the `connectionStatus` state object and `BackupConnectionScreen` to show a component used for connection.
 *
 * @returns {Array} connectionStatus, BackupConnectionScreen
 */
export default function useConnection() {
	const APINonce = useSelect( select => select( STORE_ID ).getAPINonce(), [] );
	const APIRoot = useSelect( select => select( STORE_ID ).getAPIRoot(), [] );
	const registrationNonce = useSelect( select => select( STORE_ID ).getRegistrationNonce(), [] );
	const connectionStatus = useSelect(
		select => select( CONNECTION_STORE_ID ).getConnectionStatus(),
		[]
	);
	const [ price, setPrice ] = useState( 0 );
	const [ priceAfter, setPriceAfter ] = useState( 0 );

	const checkSiteHasBackupProduct = useCallback(
		() => apiFetch( { path: '/jetpack/v4/has-backup-plan' } ),
		[]
	);

	useEffect( () => {
		apiFetch( { path: '/jetpack/v4/backup-promoted-product-info' } ).then( res => {
			setPrice( res.cost / 12 );
			if ( res.introductory_offer ) {
				setPriceAfter( res.introductory_offer.cost_per_interval / 12 );
			} else {
				setPriceAfter( res.cost / 12 );
			}
		} );
	}, [] );

	const BackupConnectionScreen = () => {
		return (
			<>
				<ConnectScreenRequiredPlan
					buttonLabel={ __( 'Get VaultPress Backup', 'jetpack-backup-pkg' ) }
					priceAfter={ priceAfter }
					priceBefore={ price }
					pricingIcon={ <JetpackVaultPressBackupLogo showText={ false } /> }
					pricingTitle={ __( 'VaultPress Backup', 'jetpack-backup-pkg' ) }
					title={ __( 'The best real-time WordPress backups', 'jetpack-backup-pkg' ) }
					apiRoot={ APIRoot }
					apiNonce={ APINonce }
					registrationNonce={ registrationNonce }
					from="jetpack-backup"
					redirectUri="admin.php?page=jetpack-backup"
					wpcomProductSlug="jetpack_backup_t1_yearly"
					siteProductAvailabilityHandler={ checkSiteHasBackupProduct }
					logo={ <></> }
					rna
				>
					<BackupPromotionBlock />
				</ConnectScreenRequiredPlan>

				<BackupVideoSection
					registrationNonce={ registrationNonce }
					apiRoot={ APIRoot }
					apiNonce={ APINonce }
					siteProductAvailabilityHandler={ checkSiteHasBackupProduct }
				/>
			</>
		);
	};

	const BackupSecondaryAdminConnectionScreen = () => {
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

	return [ connectionStatus, BackupConnectionScreen, BackupSecondaryAdminConnectionScreen ];
}
