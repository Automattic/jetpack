import { __ } from '@wordpress/i18n';
import { shield } from '@wordpress/icons';
import { useMemo } from 'react';
import { HostingFeaturePage } from '../../wpcom-hosting-feature-page/js/page.tsx';
import { scanCalloutIllustration } from './illustration.ts';
import type { FeatureConfig } from '../../wpcom-hosting-feature-page/js/types.ts';

/**
 * The Scan page's copy, imagery and Tracks IDs.
 *
 * @return The config.
 */
function getScanConfig(): FeatureConfig {
	return {
		productName: 'Protect', // Product name; do not translate.
		subTitle: __(
			'Find and fix vulnerabilities and suspicious files on your site.',
			'jetpack-mu-wpcom'
		),
		icon: shield,
		illustration: scanCalloutIllustration,
		tracksFeatureId: 'site-scan',
		tracksPath: '/wp-admin/admin.php?page=jetpack-protect',
		upgrade: {
			title: __( 'Protect against security threats', 'jetpack-mu-wpcom' ),
			description: __(
				'Automated daily scans check for malware and security vulnerabilities, with automated fixes for most issues.',
				'jetpack-mu-wpcom'
			),
		},
		activate: {
			title: __( 'Activate Protect for this site', 'jetpack-mu-wpcom' ),
			description: __(
				'Your plan includes Protect. To switch it on, your site needs to move to our hosting platform.',
				'jetpack-mu-wpcom'
			),
			action: __( 'Activate Protect', 'jetpack-mu-wpcom' ),
		},
		inProgress: {
			title: __( 'Setting up Protect', 'jetpack-mu-wpcom' ),
			description: __(
				'Your site is being moved to our hosting platform so Protect can be switched on.',
				'jetpack-mu-wpcom'
			),
		},
		modal: {
			blockedTitle: __( 'Protect cannot be activated', 'jetpack-mu-wpcom' ),
			intro: __(
				'To turn Jetpack Protect on, we’ll need to move your site over to WordPress.com’s advanced managed cloud hosting.',
				'jetpack-mu-wpcom'
			),
			holdsHeading: __( 'To activate Protect you’ll need to:', 'jetpack-mu-wpcom' ),
		},
	};
}

/**
 * The Protect page for WordPress.com Simple and WoA sites, offering Scan.
 *
 * @return The rendered page.
 */
export function App() {
	const config = useMemo( getScanConfig, [] );

	return <HostingFeaturePage config={ config } />;
}
