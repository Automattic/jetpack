import useProduct from '../../../data/products/use-product';
import { InfoTooltip } from '../../info-tooltip';
import baseStyles from '../style.module.scss';
import { AutoFirewallStatus } from './auto-firewall-status';
import { LoginsBlockedStatus } from './logins-blocked-status';
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
							feature: 'jetpack-protect',
							status: 'inactive',
						} }
					>
						<>
							<h3>{ pluginsThemesTooltip.title }</h3>
							<p>{ pluginsThemesTooltip.text }</p>
						</>
					</InfoTooltip>
				) }
			</div>
			<div className="value-section">
				<div className="value-section__scan-threats">
					<ScanAndThreatStatus />
				</div>
				<div className="value-section__auto-firewall">
					<div className={ baseStyles.valueSectionHeading }>Auto-Firewall</div>
					<div className="value-section__data">
						<AutoFirewallStatus />
					</div>
				</div>
				<div className="value-section__logins-blocked">
					<div className={ baseStyles.valueSectionHeading }>Logins Blocked</div>
					<div className="value-section__data">
						<LoginsBlockedStatus />
					</div>
				</div>
			</div>
		</>
	);
};

export default ProtectValueSection;
