import { QUERY_GET_PROTECT_DATA_KEY, REST_API_GET_PROTECT_DATA } from '../../../data/constants';
import useProduct from '../../../data/products/use-product';
import useSimpleQuery from '../../../data/use-simple-query';
import { InfoTooltip } from '../../info-tooltip';
import LoadingBlock from '../../loading-block';
import { AutoFirewallStatus } from './auto-firewall-status';
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
					<InfoTooltip
						tracksEventName={ 'protect_card_tooltip_open' }
						tracksEventProps={ {
							location: 'plugins&themes',
							feature: 'jetpack-protect',
							status: 'inactive',
						} }
					>
						<h3>{ pluginsThemesTooltip.title }</h3>
						<p>{ pluginsThemesTooltip.text }</p>
					</InfoTooltip>
				) }
			</div>
			<div className="value-section">
				<div className="value-section__scan-threats">
					{ isLoading ? (
						<LoadingBlock width="75px" height="50px" />
					) : (
						<ScanAndThreatStatus data={ protectData } />
					) }
				</div>
				<div className="value-section__auto-firewall">
					{ isLoading ? (
						<LoadingBlock width="75px" height="50px" />
					) : (
						<AutoFirewallStatus data={ protectData } />
					) }
				</div>
				<div className="value-section__logins-blocked">
					{ isLoading ? (
						<LoadingBlock width="75px" height="50px" />
					) : (
						<LoginsBlockedStatus data={ protectData } />
					) }
				</div>
			</div>
		</>
	);
};

export default ProtectValueSection;
