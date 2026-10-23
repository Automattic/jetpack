import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useCallback, useMemo, createElement, type ReactElement } from 'react';
import { PRODUCT_SLUGS } from '../../../data/constants';
import useProduct from '../../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../../hooks/use-analytics';
import { isJetpackPluginActive } from '../../../utils/is-jetpack-plugin-active';
import { getProtectPageUrl } from '../../../utils/protect-page';

type TooltipType = 'pluginsThemesTooltip' | 'scanThreatsTooltip' | 'blockedLoginsTooltip';
type Tooltip = {
	title: ReactElement | string;
	text: ReactElement | string;
};
export type TooltipContent = {
	[ key in TooltipType ]: Tooltip;
} & {
	// Null when the firewall runs with automatic rules: nothing to explain.
	firewallTooltip: Tooltip | null;
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
			? threats.reduce( ( accum, threat ) => ( threat.severity >= 5 ? accum + 1 : accum ), 0 )
			: 0;
	}, [ threats ] );

	const settingsLink = useMemo( () => {
		if ( isStandaloneActive ) {
			return 'admin.php?page=jetpack-protect#/firewall';
		}
		return isJetpackPluginActive() ? 'admin.php?page=jetpack#/settings' : null;
	}, [ isStandaloneActive ] );
	const loginSettingsLink = getProtectPageUrl( 'protect' ) ?? settingsLink;
	const firewallSettingsLink = getProtectPageUrl( 'waf' ) ?? settingsLink;
	let loginSettingsName = isStandaloneActive ? 'firewall settings' : 'Jetpack settings';
	if ( getProtectPageUrl( 'protect' ) ) {
		/* translators: "Protect" is a product name. */
		loginSettingsName = __( 'Protect settings', 'jetpack-my-jetpack' );
	}

	const trackFirewallSettingsLinkClick = useCallback( () => {
		recordEvent( 'jetpack_protect_card_tooltip_content_link_click', {
			page: 'my-jetpack',
			feature: 'jetpack-protect',
			location: 'auto-firewall-tooltip',
			path: firewallSettingsLink,
		} );
	}, [ recordEvent, firewallSettingsLink ] );

	// Same location as the firewall link, as before, so only the path tells them apart.
	const trackLoginSettingsLinkClick = useCallback( () => {
		recordEvent( 'jetpack_protect_card_tooltip_content_link_click', {
			page: 'my-jetpack',
			feature: 'jetpack-protect',
			location: 'auto-firewall-tooltip',
			path: loginSettingsLink,
		} );
	}, [ recordEvent, loginSettingsLink ] );

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
				text: loginSettingsLink
					? createInterpolateElement(
							sprintf(
								/* translators: %s is the location/page where the settings are located: "Protect settings", "firewall settings" or "Jetpack settings". */
								__(
									'Brute Force Protection is disabled and not actively blocking malicious login attempts. Go to <a>%s</a> to activate it.',
									'jetpack-my-jetpack'
								),
								loginSettingsName
							),
							{
								a: createElement( 'a', {
									href: loginSettingsLink,
									onClick: trackLoginSettingsLinkClick,
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
				text: loginSettingsLink
					? createInterpolateElement(
							sprintf(
								/* translators: %s is the location/page where the settings are located: "Protect settings", "firewall settings" or "Jetpack settings". */
								__(
									'Brute Force Protection is disabled and not actively blocking malicious login attempts. Go to <a>%s</a> to activate it.',
									'jetpack-my-jetpack'
								),
								loginSettingsName
							),
							{
								a: createElement( 'a', {
									href: loginSettingsLink,
									onClick: trackLoginSettingsLinkClick,
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
		loginSettingsLink,
		loginSettingsName,
		trackLoginSettingsLinkClick,
	] );

	const firewallTooltip = useMemo( (): Tooltip | null => {
		const withSettingsLink = ( text: string, withoutLink: string ) =>
			firewallSettingsLink
				? createInterpolateElement( text, {
						a: createElement( 'a', {
							href: firewallSettingsLink,
							onClick: trackFirewallSettingsLinkClick,
						} ),
					} )
				: withoutLink;

		if ( ! wafSupported ) {
			return {
				title: __( 'Firewall: Inactive', 'jetpack-my-jetpack' ),
				text: __(
					'Jetpack’s firewall is off because your hosting provider already includes a built-in firewall with similar rules for your site.',
					'jetpack-my-jetpack'
				),
			};
		}

		if ( ! isWafEnabled ) {
			return {
				title: __( 'Firewall: Off', 'jetpack-my-jetpack' ),
				text: withSettingsLink(
					__(
						'The firewall isn’t blocking any requests. Turn it on in your <a>firewall settings</a>.',
						'jetpack-my-jetpack'
					),
					__( 'The firewall isn’t blocking any requests.', 'jetpack-my-jetpack' )
				),
			};
		}

		if ( isAutoFirewallEnabled ) {
			return null;
		}

		if ( hasProtectPaidPlan ) {
			return {
				title: __( 'Firewall: On', 'jetpack-my-jetpack' ),
				text: withSettingsLink(
					__(
						'Automatic rules are off, so only the IP addresses you list are blocked. Turn them on in your <a>firewall settings</a>.',
						'jetpack-my-jetpack'
					),
					__(
						'Automatic rules are off, so only the IP addresses you list are blocked.',
						'jetpack-my-jetpack'
					)
				),
			};
		}

		return {
			title: __( 'Firewall: On', 'jetpack-my-jetpack' ),
			text: __(
				'The firewall blocks the IP addresses you list. Upgrade for automatic rules that stop known attacks.',
				'jetpack-my-jetpack'
			),
		};
	}, [
		wafSupported,
		isWafEnabled,
		isAutoFirewallEnabled,
		hasProtectPaidPlan,
		firewallSettingsLink,
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
		firewallTooltip: firewallTooltip,
		blockedLoginsTooltip: blockedLoginsTooltip,
	};
};
