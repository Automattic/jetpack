import useProduct from '../../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import { AutoFirewallStatus } from './auto-firewall-status';
import { InfoTooltip } from './info-tooltip';
import { ScanAndThreatStatus } from './scan-threats-status';
import { useLastScanText } from './use-last-scan-text';
import { useProtectTooltipCopy } from './use-protect-tooltip-copy';

import './style.scss';

const ProtectValueSection = () => {
	const slug = 'protect';
	const { detail } = useProduct( slug );
	const { isPluginActive = false } = detail || {};
	const lastScanText = useLastScanText();
	const tooltipContent = useProtectTooltipCopy();
	const { pluginsThemesTooltip } = tooltipContent;

	return (
		<>
			<div className="value-section__last-scan">
				{ lastScanText && <div>{ lastScanText }</div> }
				{ ! isPluginActive && (
					<InfoTooltip
						tracksEventName={ 'protect_card_tooltip_open' }
						tracksEventProps={ {
							location: 'plugins&themes',
							status: 'inactive',
						} }
					>
						<>
							<h3 className="value-section__tooltip-heading">{ pluginsThemesTooltip.title }</h3>
							<p className="value-section__tooltip-content">{ pluginsThemesTooltip.text }</p>
						</>
					</InfoTooltip>
				) }
			</div>
			<div className="value-section">
				<div className="value-section__scan-threats">
					<ScanAndThreatStatus />
				</div>
				<div className="value-section__auto-firewall">
					<div className="value-section__heading">Auto-Firewall</div>
					<div className="value-section__data">
						<AutoFirewallStatus />
					</div>
				</div>
				<div className="value-section__logins-blocked">
					<div className="value-section__heading">Logins Blocked</div>
					<div className="value-section__data">
						<LoginsBlockedStatus />
					</div>
				</div>
			</div>
		</>
	);
};

export default ProtectValueSection;

const LoginsBlockedStatus = () => {
	const {
		protect: { wafConfig: wafData },
	} = getMyJetpackWindowInitialState();
	const { blocked_logins: blockedLoginsCount } = wafData;

	return <div className="logins_blocked__count">{ blockedLoginsCount }</div>;
};
