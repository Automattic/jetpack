import { __ } from '@wordpress/i18n';
import {
	protectCardShieldInactive as ShieldInactive,
	protectCardShieldOff as ShieldOff,
	protectCardShieldSuccess as ShieldSuccess,
} from '../../../assets/inline-svgs';
import useProduct from '../../../data/products/use-product';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import { ProtectInfoPopover } from './info-popover';
import { useProtectTooltipCopy } from './use-protect-tooltip-copy';
import type { FirewallState } from './use-protect-tooltip-copy';
import type { FC } from 'react';

interface FirewallStatusProps {
	// Undefined when the Protect data request fails.
	data?: ProtectData;
}

export const FirewallStatus: FC< FirewallStatusProps > = ( { data } ) => {
	const slug = 'protect';
	const { detail } = useProduct( slug );
	const { isPluginActive = false, hasPaidPlanForProduct = false } = detail || {};
	const { isSiteConnected } = useMyJetpackConnection();
	const { firewallTooltips } = useProtectTooltipCopy( data );
	const {
		waf_enabled: isWafEnabled,
		waf_supported: wafSupported,
		waf_provided_by_host: providedByHost,
	} = data?.wafConfig || {};
	const isRunning = isPluginActive && isSiteConnected;

	// The firewall module decides On, as on the Protect page; automatic rules only add to it.
	let status: FirewallState = 'off';
	if ( isRunning && providedByHost ) {
		status = 'host';
	} else if ( isRunning && ! wafSupported ) {
		status = 'inactive';
	} else if ( isRunning && isWafEnabled ) {
		status = 'active';
	}

	const display: Record< FirewallState, { text: string; alt: string; icon: string } > = {
		active: {
			text: __( 'On', 'jetpack-my-jetpack' ),
			alt: __( 'Shield icon - Firewall Status: On', 'jetpack-my-jetpack' ),
			icon: ShieldSuccess,
		},
		host: {
			text: __( 'On', 'jetpack-my-jetpack' ),
			alt: __( 'Shield icon - Firewall Status: On', 'jetpack-my-jetpack' ),
			icon: ShieldSuccess,
		},
		inactive: {
			text: __( 'Inactive', 'jetpack-my-jetpack' ),
			alt: __( 'Shield icon - Firewall Status: Inactive', 'jetpack-my-jetpack' ),
			icon: ShieldInactive,
		},
		off: {
			text: __( 'Off', 'jetpack-my-jetpack' ),
			alt: __( 'Shield icon - Firewall Status: Off', 'jetpack-my-jetpack' ),
			icon: ShieldOff,
		},
	};
	const { text, alt, icon } = display[ status ];
	// Disconnected, or the firewall's data failed to load: there is no state to explain.
	const tooltip = isRunning && data?.wafConfig ? firewallTooltips[ status ] : null;

	return (
		<>
			<div className="value-section__heading">
				{ __( 'Firewall', 'jetpack-my-jetpack' ) }
				{ tooltip && (
					<ProtectInfoPopover
						label={ __( 'Firewall', 'jetpack-my-jetpack' ) }
						title={ tooltip.title }
						text={ tooltip.text }
						tracksEventProps={ {
							// Kept from the old Auto-Firewall row so existing Tracks reports carry on.
							location: 'auto-firewall',
							status,
							has_paid_plan: hasPaidPlanForProduct,
						} }
					/>
				) }
			</div>
			<div className="value-section__data">
				<div>
					<img className="value-section__status-icon" src={ icon } alt={ alt } />
				</div>
				<div className="value-section__status-text">{ text }</div>
			</div>
		</>
	);
};
