import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useCallback, useMemo, createElement, type ReactElement } from 'react';
import useProduct from '../../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../../hooks/use-analytics';

type TooltipType =
	| 'pluginsThemesTooltip'
	| 'scanThreatsTooltip'
	| 'autoFirewallTooltip'
	| 'blockedLoginsTooltip';
export type TooltipContent = {
	[ key in TooltipType ]: {
		title: ReactElement | string;
		text: ReactElement | string;
	};
};

/**
 * Gets the translated tooltip copy based on Protect Scan details.
 *
 * @returns {TooltipContent} An object containing each tooltip's title and text content.
 */
export function useProtectTooltipCopy(): TooltipContent {
	const slug = 'protect';
	const { detail } = useProduct( slug );
	const { isPluginActive: isProtectPluginActive, hasPaidPlanForProduct: hasProtectPaidPlan } =
		detail;
	const { recordEvent } = useAnalytics();
	const {
		plugins,
		themes,
		protect: { scanData, wafConfig: wafData },
	} = getMyJetpackWindowInitialState();
	const {
		plugins: fromScanPlugins,
		themes: fromScanThemes,
		num_threats: numThreats = 0,
	} = scanData;
	const {
		jetpack_waf_automatic_rules: isAutoFirewallEnabled,
		blocked_logins: blockedLoginsCount,
		brute_force_protection: hasBruteForceProtection,
	} = wafData;

	const pluginsCount = fromScanPlugins.length || Object.keys( plugins ).length;
	const themesCount = fromScanThemes.length || Object.keys( themes ).length;

	const isJetpackPluginActive = useMemo( () => {
		const jetpackPlugin = Object.values( plugins ).find( plugin => plugin?.Name === 'Jetpack' );
		return jetpackPlugin && jetpackPlugin.active;
	}, [ plugins ] );

	const trackFirewallSettingsLinkClick = useCallback( () => {
		recordEvent( 'jetpack_protect_card_tooltip_content_link_click', {
			page: 'my-jetpack',
			feature: 'jetpack-protect',
			location: 'auto-firewall-tooltip',
			path: 'admin.php?page=jetpack-protect#/firewall',
		} );
	}, [ recordEvent ] );

	const isBruteForcePluginsActive = isProtectPluginActive || isJetpackPluginActive;

	const blockedLoginsTooltip = useMemo( () => {
		if ( blockedLoginsCount === 0 ) {
			if ( hasBruteForceProtection ) {
				return {
					title: __( 'Brute Force Protection: Active', 'jetpack-my-jetpack' ),
					text: __(
						'Brute Force Protection is actively blocking malicious login attempts. Data will display here soon!',
						'jetpack-my-jetpack'
					),
				};
			}
			return {
				title: __( 'Brute Force Protection: Inactive', 'jetpack-my-jetpack' ),
				text: __(
					'Brute Force Protection is disabled and not actively blocking malicious login attempts.',
					'jetpack-my-jetpack'
				),
			};
		}
		// blockedLoginsCount is greator than 0 here.
		if ( ! hasBruteForceProtection ) {
			if ( ! isBruteForcePluginsActive ) {
				return {
					title: __( 'Brute Force Protection: Inactive', 'jetpack-my-jetpack' ),
					text: __(
						'For Brute Force Protection, activate the Jetpack or Protect plugin and enable it in settings',
						'jetpack-my-jetpack'
					),
				};
			}
			return {
				title: __( 'Brute Force Protection: Inactive', 'jetpack-my-jetpack' ),
				text: __(
					'Brute Force Protection is disabled and not actively blocking malicious login attempts.',
					'jetpack-my-jetpack'
				),
			};
		}
	}, [ blockedLoginsCount, hasBruteForceProtection, isBruteForcePluginsActive ] );

	return {
		pluginsThemesTooltip: {
			title: __( 'Improve site safety: secure plugins & themes', 'jetpack-my-jetpack' ),
			text: sprintf(
				/* translators: %1$s the singular or plural of number of plugin(s), and %2$s is the singular or plural of the number of theme(s). */
				__(
					'Your site has %1$s and %2$s lacking security measures. Improve your site’s safety by adding protection at no cost.',
					'jetpack-my-jetpack'
				),
				sprintf(
					/* translators: %d is the number of plugins installed on the site. */
					_n( '%d plugin', '%d plugins', pluginsCount, 'jetpack-my-jetpack' ),
					pluginsCount
				),
				sprintf(
					/* translators: %d is the number of themes installed on the site. */
					_n( '%d theme', '%d themes', themesCount, 'jetpack-my-jetpack' ),
					themesCount
				)
			),
		},
		scanThreatsTooltip:
			hasProtectPaidPlan && numThreats
				? {
						title: __( 'Auto-fix threats', 'jetpack-my-jetpack' ),
						text: sprintf(
							/* translators: %s is the singular or plural of number of detected critical threats on the site. */
							__(
								'The last scan identified %s. But don’t worry, use the “Auto-fix” button in the product to automatically fix most threats.',
								'jetpack-my-jetpack'
							),
							sprintf(
								/* translators: %d is the number of detected scan threats on the site. */
								_n(
									'%d critical threat.',
									'%d critical threats.',
									numThreats,
									'jetpack-my-jetpack'
								),
								numThreats
							)
						),
				  }
				: {
						title: __( 'Elevate your malware protection', 'jetpack-my-jetpack' ),
						text: __(
							'We’ve checked items against our database, and all appears well. For a more detailed, line-by-line malware scan, consider upgrading your plan.',
							'jetpack-my-jetpack'
						),
				  },
		autoFirewallTooltip:
			hasProtectPaidPlan && ! isAutoFirewallEnabled
				? {
						title: __( 'Auto-Firewall: Inactive', 'jetpack-my-jetpack' ),
						text: createInterpolateElement(
							__(
								'You have Auto-Firewall disabled, visit your Protect <a>firewall settings</a> to activate.',
								'jetpack-my-jetpack'
							),
							{
								a: createElement( 'a', {
									href: 'admin.php?page=jetpack-protect#/firewall',
									onClick: trackFirewallSettingsLinkClick,
								} ),
							}
						),
				  }
				: {
						title: __( 'Auto-Firewall: Inactive', 'jetpack-my-jetpack' ),
						text: __(
							'Upgrade required for activation. Manual rules available.',
							'jetpack-my-jetpack'
						),
				  },
		blockedLoginsTooltip: blockedLoginsTooltip,
	};
}
