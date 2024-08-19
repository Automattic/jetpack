import { JetpackVaultPressBackupLogo, Testimonials } from '@automattic/jetpack-components';
import { ConnectScreenRequiredPlan } from '@automattic/jetpack-connection';
import apiFetch from '@wordpress/api-fetch';
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { useBackupProductInfo } from '../../hooks/use-backup-product-info';
import { STORE_ID } from '../../store';
import BackupPromotionBlock from '../backup-promotion';
import { BackupVideoSection } from '../backup-video-section';
import { WhyINeedVPBackup } from '../why-i-need-vp-backup';
import benGiordanoTestimonial from './assets/ben-giordano-testimonial.png';
import timFerrissTestimonial from './assets/tim-ferriss-testimonial.png';

const testimonials = [
	{
		quote: __(
			'Millions of people depend on my site, and downtime isn’t an option. Jetpack VaultPress Backup handles my site security and backups so I can focus on creation.',
			'jetpack-backup-pkg'
		),
		author: 'Tim Ferriss',
		profession: __( 'Author / Investor / Podcaster', 'jetpack-backup-pkg' ),
		img: timFerrissTestimonial,
	},
	{
		quote: __(
			'Our developers use VaultPress Backup all the time. It’s a one‑click way to return to where we were before things got wonky. It gives us a little emergency parachute so if we’re working on a customization that breaks everything, we lose minutes, not hours.',
			'jetpack-backup-pkg'
		),
		author: 'Ben Giordano',
		profession: __( 'Founder, FreshySites.com', 'jetpack-backup-pkg' ),

		img: benGiordanoTestimonial,
	},
];

export const BackupConnectionScreen = () => {
	const APINonce = useSelect( select => select( STORE_ID ).getAPINonce(), [] );
	const APIRoot = useSelect( select => select( STORE_ID ).getAPIRoot(), [] );
	const registrationNonce = useSelect( select => select( STORE_ID ).getRegistrationNonce(), [] );
	const { price, priceAfter } = useBackupProductInfo();

	const checkSiteHasBackupProduct = useCallback(
		() => apiFetch( { path: '/jetpack/v4/has-backup-plan' } ),
		[]
	);

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

			<Testimonials testimonials={ testimonials } />

			<BackupVideoSection
				registrationNonce={ registrationNonce }
				apiRoot={ APIRoot }
				apiNonce={ APINonce }
				siteProductAvailabilityHandler={ checkSiteHasBackupProduct }
			/>

			<WhyINeedVPBackup />
		</>
	);
};
