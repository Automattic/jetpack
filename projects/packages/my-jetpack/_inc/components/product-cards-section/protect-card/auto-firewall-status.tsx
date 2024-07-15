import { __ } from '@wordpress/i18n';
import useProduct from '../../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import ShieldInactive from './assets/shield-inactive.svg';
import ShieldOff from './assets/shield-off.svg';
import ShieldSuccess from './assets/shield-success.svg';
import { InfoTooltip } from './info-tooltip';
import { useProtectTooltipCopy, type TooltipContent } from './use-protect-tooltip-copy';
import type { ReactElement, PropsWithChildren } from 'react';

export const AutoFirewallStatus = () => {
	const slug = 'protect';
	const { detail } = useProduct( slug );
	const { isPluginActive = false } = detail || {};
	const { isSiteConnected } = useMyJetpackConnection();
	const { wafConfig: wafData } = getMyJetpackWindowInitialState();
	const { jetpack_waf_automatic_rules: isAutoFirewallEnabled } = wafData;

	const tooltipContent = useProtectTooltipCopy();
	const { autoFirewallTooltip } = tooltipContent;

	if ( isPluginActive && isSiteConnected ) {
		if ( isAutoFirewallEnabled ) {
			return <WafStatus status="success" tooltipContent={ autoFirewallTooltip } />;
		}

		return <WafStatus status="inactive" tooltipContent={ autoFirewallTooltip } />;
	}

	return <WafStatus status="off" tooltipContent={ autoFirewallTooltip } />;
};

/**
 * WafStatus component
 *
 * @param {PropsWithChildren} props - The component props
 * @param {'success' | 'inactive' | 'off'} props.status - The number of threats
 * @param {TooltipContent[ 'autoFirewallTooltip' ]} props.tooltipContent - The Firewall Inactive tooltip content
 * @returns {ReactElement} rendered component
 */
function WafStatus( {
	status,
	tooltipContent,
}: {
	status: 'success' | 'inactive' | 'off';
	tooltipContent?: TooltipContent[ 'autoFirewallTooltip' ];
} ) {
	if ( status === 'success' ) {
		return (
			<>
				<div>
					<img
						className="value-section__status-icon"
						src={ ShieldSuccess }
						alt={ __( 'Shield icon - Auto-Firewall Status: On', 'jetpack-my-jetpack' ) }
					/>
				</div>
				<div className="value-section__status-text">{ __( 'On', 'jetpack-my-jetpack' ) }</div>
			</>
		);
	}
	if ( status === 'inactive' ) {
		return (
			<>
				<div>
					<img
						className="value-section__status-icon"
						src={ ShieldInactive }
						alt={ __( 'Shield icon - Auto-Firewall Status: Inactive', 'jetpack-my-jetpack' ) }
					/>
				</div>
				<div className="value-section__status-text">{ __( 'Inactive', 'jetpack-my-jetpack' ) }</div>
				<InfoTooltip
					tracksEventName={ 'protect_card_tooltip_open' }
					tracksEventProps={ {
						location: 'auto-firewall',
						status: 'inactive',
						hasPaidPlan: false,
					} }
				>
					<>
						<h3 className="value-section__tooltip-heading">{ tooltipContent.title }</h3>
						<p className="value-section__tooltip-content">{ tooltipContent.text }</p>
					</>
				</InfoTooltip>
			</>
		);
	}
	return (
		<>
			<div>
				<img
					className="value-section__status-icon"
					src={ ShieldOff }
					alt={ __( 'Shield icon - Auto-Firewall Status: Off', 'jetpack-my-jetpack' ) }
				/>
			</div>
			<div className="value-section__status-text">{ __( 'Off', 'jetpack-my-jetpack' ) }</div>
		</>
	);
}
