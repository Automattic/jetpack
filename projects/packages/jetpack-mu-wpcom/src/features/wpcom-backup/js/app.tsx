import { __ } from '@wordpress/i18n';
import { backup } from '@wordpress/icons';
import { useMemo } from 'react';
import { HostingFeaturePage } from '../../wpcom-hosting-feature-page/js/page.tsx';
import { backupsCalloutIllustration } from './illustration.ts';
import type { FeatureConfig } from '../../wpcom-hosting-feature-page/js/types.ts';

/**
 * The Backup page's copy, imagery and Tracks IDs.
 *
 * @return The config.
 */
function getBackupConfig(): FeatureConfig {
	return {
		productName: 'VaultPress Backup', // Product name; do not translate.
		subTitle: __( 'Save changes and restore quickly with one-click recovery.', 'jetpack-mu-wpcom' ),
		icon: backup,
		illustration: backupsCalloutIllustration,
		tracksFeatureId: 'site-backups',
		tracksPath: '/wp-admin/admin.php?page=jetpack-backup',
		upgrade: {
			title: __( 'Secure your content with Jetpack Backups', 'jetpack-mu-wpcom' ),
			description: __(
				'Protect your site with scheduled and real-time backups—giving you the ultimate “undo” button and peace of mind that your content is always safe.',
				'jetpack-mu-wpcom'
			),
		},
		activate: {
			title: __( 'Activate backups for this site', 'jetpack-mu-wpcom' ),
			description: __(
				'Your plan includes backups. To switch them on, your site needs to move to our hosting platform.',
				'jetpack-mu-wpcom'
			),
			action: __( 'Activate backups', 'jetpack-mu-wpcom' ),
		},
		inProgress: {
			title: __( 'Setting up backups', 'jetpack-mu-wpcom' ),
			description: __(
				'Your site is being moved to our hosting platform so backups can be switched on.',
				'jetpack-mu-wpcom'
			),
		},
		modal: {
			blockedTitle: __( 'Backups cannot be activated', 'jetpack-mu-wpcom' ),
			intro: __(
				'To turn Jetpack VaultPress Backup on, we’ll need to move your site over to WordPress.com’s advanced managed cloud hosting.',
				'jetpack-mu-wpcom'
			),
			holdsHeading: __( 'To activate backups you’ll need to:', 'jetpack-mu-wpcom' ),
		},
	};
}

/**
 * The Backup page for WordPress.com Simple and WoA sites.
 *
 * @return The rendered page.
 */
export function App() {
	const config = useMemo( getBackupConfig, [] );

	return <HostingFeaturePage config={ config } />;
}
