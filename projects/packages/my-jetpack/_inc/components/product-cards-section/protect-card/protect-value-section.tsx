import { QUERY_GET_PROTECT_DATA_KEY, REST_API_GET_PROTECT_DATA } from '../../../data/constants';
import useProduct from '../../../data/products/use-product';
import useSimpleQuery from '../../../data/use-simple-query';
import LoadingBlock from '../../loading-block';
import { AutoFirewallStatus } from './auto-firewall-status';
import { ProtectInfoPopover } from './info-popover';
import { LoginsBlockedStatus } from './logins-blocked-status';
import { ScanAndThreatStatus } from './scan-threats-status';
import { useLastScanText } from './use-last-scan-text';
import { useProtectTooltipCopy } from './use-protect-tooltip-copy';

import './style.scss';

const ProtectValueSection = () => {
	const slug = 'protect';
	const { detail, isLoading: isLoadingProduct } = useProduct( slug );
	const { isPluginActive = false } = detail || {};
	const { data: protectData, isLoading: isLoadingProtectData } = useSimpleQuery< ProtectData >( {
		name: QUERY_GET_PROTECT_DATA_KEY,
		query: {
			path: REST_API_GET_PROTECT_DATA,
		},
	} );
	const lastScanText = useLastScanText( protectData );
	const tooltipContent = useProtectTooltipCopy( protectData );
	const { pluginsThemesTooltip } = tooltipContent;

	const isLoading = isLoadingProduct || isLoadingProtectData;

	return (
		<>
			<div className="value-section__last-scan">
				{ isLoading ? (
					<LoadingBlock width="150px" height="16px" />
				) : (
					lastScanText && <div>{ lastScanText }</div>
				) }
				{ ! isPluginActive && (
					<ProtectInfoPopover
						label={ lastScanText ?? '' }
						title={ pluginsThemesTooltip.title }
						text={ pluginsThemesTooltip.text }
						tracksEventProps={ {
							location: 'plugins&themes',
							status: 'inactive',
						} }
					/>
				) }
			</div>
			<div className="value-section">
				<div className="value-section__scan-threats">
					{ isLoading ? (
						<LoadingBlock width="100%" height="20px" />
					) : (
						<ScanAndThreatStatus data={ protectData } />
					) }
				</div>
				<div className="value-section__auto-firewall">
					{ isLoading ? (
						<LoadingBlock width="100%" height="20px" />
					) : (
						<AutoFirewallStatus data={ protectData } />
					) }
				</div>
				<div className="value-section__logins-blocked">
					{ isLoading ? (
						<LoadingBlock width="100%" height="20px" />
					) : (
						<LoginsBlockedStatus data={ protectData } />
					) }
				</div>
			</div>
		</>
	);
};

export default ProtectValueSection;
