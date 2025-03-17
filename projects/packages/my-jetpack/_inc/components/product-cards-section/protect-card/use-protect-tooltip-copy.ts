import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useCallback, useMemo, createElement, type ReactElement } from 'react';
import { PRODUCT_SLUGS } from '../../../data/constants';
import useProduct from '../../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../../hooks/use-analytics';
import { isJetpackPluginActive } from '../../../utils/is-jetpack-plugin-active';

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

export const useProtectTooltipCopy = ( data: ProtectData ): TooltipContent => {
	const slug = PRODUCT_SLUGS.PROTECT;
	const { detail } = useProduct( slug );
	const {
		standalonePluginInfo,
		hasPaidPlanForProduct: hasProtectPaidPlan,
		manageUrl: protectDashboardUrl,
	} = detail || {};
	const { isStandaloneActive } = standalonePluginInfo || {};
	const { recordEvent } = useAnalytics();
	const { plugins, themes } = getMyJetpackWindowInitialState();
	const {
		plugins: fromScanPlugins,
		themes: fromScanThemes,
		num_threats: numThreats = 0,
		threats = [],
	} = data?.scanData || {};
	const {
		jetpack_waf_automatic_rules: isAutoFirewallEnabled,
		blocked_logins: blockedLoginsCount,
		brute_force_protection: hasBruteForceProtection,
		waf_supported: wafSupported,
		waf_enabled: isWafEnabled,
	} = data?.wafConfig || {};

	const pluginsCount = fromScanPlugins?.length || Object.keys( plugins ).length;
	const themesCount = fromScanThemes?.length || Object.keys( themes ).length;

	const criticalThreatCount: number = useMemo( () => {
		return threats.length
			? threats.reduce( ( accum, threat ) => ( threat.severity >= 5 ? ( accum += 1 ) : accum ), 0 )
			: 0;
	}, [ threats ] );

	const settingsLink = useMemo( () => {
		if ( isStandaloneActive ) {
			return 'admin.php?page=jetpack-protect#/firewall';
		}
		return isJetpackPluginActive() ? 'admin.php?page=jetpack#/settings' : null;
	}, [ isStandaloneActive ] );

	const trackFirewallSettingsLinkClick = useCallback( () => {
		recordEvent( 'jetpack_protect_card_tooltip_content_link_click', {
			page: 'my-jetpack',
			feature: 'jetpack-protect',
			location: 'auto-firewall-tooltip',
			path: settingsLink,
		} );
	}, [ recordEvent, settingsLink ] );

	const trackProtectDashboardLinkClick = useCallback( () => {
		recordEvent( 'jetpack_protect_card_tooltip_content_link_click', {
			page: 'my-jetpack',
			feature: 'jetpack-protect',
			location: 'scan-threats-tooltip',
			path: protectDashboardUrl,
		} );
	}, [ recordEvent, protectDashboardUrl ] );

	const isBruteForcePluginsActive = isStandaloneActive || isJetpackPluginActive();

	const blockedLoginsTooltip = useMemo( () => {
		if ( blockedLoginsCount === 0 ) {
			if ( hasBruteForceProtection ) {
				return {
					title: __( 'Brute Force Protection: Active', 'jetpack-my-jetpack' ),
					text: __(
						'Brute Force Protection is actively blocking malicious login attempts. The number of blocked login attempts will display here soon!',
						'jetpack-my-jetpack'
					),
				};
			}
			return {
				title: __( 'Brute Force Protection: Inactive', 'jetpack-my-jetpack' ),
				text: settingsLink
					? createInterpolateElement(
							sprintf(
								/* translators: %s is the location/page where the settings are located. Either "firewall settings" or "Jetpack settings". */
								__(
									'Brute Force Protection is disabled and not actively blocking malicious login attempts. Go to <a>%s</a> to activate it.',
									'jetpack-my-jetpack'
								),
								isStandaloneActive ? 'firewall settings' : 'Jetpack settings'
							),
							{
								a: createElement( 'a', {
									href: settingsLink,
									onClick: trackFirewallSettingsLinkClick,
								} ),
							}
					  )
					: __(
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
						'For Brute Force Protection, activate the Jetpack or Protect plugin and enable it in settings.',
						'jetpack-my-jetpack'
					),
				};
			}
			return {
				title: __( 'Brute Force Protection: Inactive', 'jetpack-my-jetpack' ),
				text: settingsLink
					? createInterpolateElement(
							sprintf(
								/* translators: %s is the location/page where the settings are located. Either "firewall settings" or "Jetpack settings". */
								__(
									'Brute Force Protection is disabled and not actively blocking malicious login attempts. Go to <a>%s</a> to activate it.',
									'jetpack-my-jetpack'
								),
								isStandaloneActive ? 'firewall settings' : 'Jetpack settings'
							),
							{
								a: createElement( 'a', {
									href: settingsLink,
									onClick: trackFirewallSettingsLinkClick,
								} ),
							}
					  )
					: __(
							'Brute Force Protection is disabled and not actively blocking malicious login attempts.',
							'jetpack-my-jetpack'
					  ),
			};
		}
	}, [
		blockedLoginsCount,
		hasBruteForceProtection,
		isBruteForcePluginsActive,
		isStandaloneActive,
		settingsLink,
		trackFirewallSettingsLinkClick,
	] );

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
						text: criticalThreatCount
							? createInterpolateElement(
									sprintf(
										/* translators: %1$s is the number of threats, %2$s is the numner of critical threats on the site, and %3$s is either "Scan" or "Protect" (the type of dashboard). */
										__(
											'The last scan identified %1$s (%2$d\u00A0critical). But don’t worry, Protect is usually able to “Auto-fix” threats, in most cases. Visit the <a>%3$s dashboard</a> to view more details.',
											'jetpack-my-jetpack'
										),
										sprintf(
											/* translators: %d is the number of detected scan threats on the site. */
											_n( '%d threat', '%d threats', numThreats, 'jetpack-my-jetpack' ),
											numThreats
										),
										criticalThreatCount,
										isStandaloneActive ? 'Protect' : 'Scan'
									),
									{
										a: createElement( 'a', {
											href: protectDashboardUrl,
											onClick: trackProtectDashboardLinkClick,
										} ),
									}
							  )
							: createInterpolateElement(
									sprintf(
										/* translators: %1$s is the singular or plural of number of detected threats on the site, and %2$s is either "Scan" or "Protect" (the type of dashboard). */
										__(
											'The last scan identified %1$s. But don’t worry, Protect is usually able to “Auto-fix” threats, in most cases. Visit the <a>%2$s dashboard</a> to view more details.',
											'jetpack-my-jetpack'
										),
										sprintf(
											/* translators: %d is the number of detected scan threats on the site. */
											_n( '%d threat', '%d threats', numThreats, 'jetpack-my-jetpack' ),
											numThreats
										),
										isStandaloneActive ? 'Protect' : 'Scan'
									),
									{
										a: createElement( 'a', {
											href: protectDashboardUrl,
											onClick: trackProtectDashboardLinkClick,
										} ),
									}
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
			( hasProtectPaidPlan && ( ! isAutoFirewallEnabled || ! isWafEnabled ) ) || ! wafSupported
				? {
						title: __( 'Auto-Firewall: Inactive', 'jetpack-my-jetpack' ),
						text: wafSupported
							? createInterpolateElement(
									__(
										'You have Auto-Firewall disabled, visit your Protect <a>firewall settings</a> to activate.',
										'jetpack-my-jetpack'
									),
									{
										a: createElement( 'a', {
											href: settingsLink,
											onClick: trackFirewallSettingsLinkClick,
										} ),
									}
							  )
							: __(
									'Auto-Firewall is disabled as your hosting provider already includes a built-in firewall with similar rules for your site.',
									'jetpack-my-jetpack'
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
};
