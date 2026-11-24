import { __ } from '@wordpress/i18n';
import { currencyDollar } from '@wordpress/icons';
import { useMemo } from 'react';
import { HostingFeaturePage } from '../../wpcom-hosting-feature-page/js/page.tsx';
import { monetizeCalloutIllustration } from './illustration.ts';
import type { BaseFeatureConfig } from '../../wpcom-hosting-feature-page/js/types.ts';

/**
 * The Monetize page's copy, imagery and Tracks IDs.
 *
 * @return The config.
 */
function getMonetizeConfig(): BaseFeatureConfig {
	return {
		productName: __( 'Monetize', 'jetpack-mu-wpcom' ),
		subTitle: __(
			'Earn money from your site with payments, paid subscribers, and ads.',
			'jetpack-mu-wpcom'
		),
		icon: currencyDollar,
		illustration: monetizeCalloutIllustration,
		tracksFeatureId: 'monetize',
		tracksPath: '/wp-admin/admin.php?page=jetpack-monetize',
		enable: {
			title: __( 'Monetize is turned off', 'jetpack-mu-wpcom' ),
			description: __(
				'Monetize is turned off on this site. Turn it on to manage payments, paid subscribers, and ads.',
				'jetpack-mu-wpcom'
			),
			action: __( 'Turn on Monetize', 'jetpack-mu-wpcom' ),
			failed: __(
				'There was a problem turning on Monetize. Contact our support team for help.',
				'jetpack-mu-wpcom'
			),
			connectionFailed: __(
				'Monetize couldn’t be turned on because your site isn’t connected to WordPress.com. Contact our support team to reconnect it.',
				'jetpack-mu-wpcom'
			),
		},
	};
}

/**
 * The Monetize page for WoA sites that turned the Jetpack plugin's dashboard off.
 *
 * @return The rendered page.
 */
export function App() {
	const config = useMemo( getMonetizeConfig, [] );

	return <HostingFeaturePage config={ config } />;
}
