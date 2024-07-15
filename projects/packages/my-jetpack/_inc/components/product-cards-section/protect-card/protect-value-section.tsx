import { __, _n, sprintf } from '@wordpress/i18n';
import { useMemo } from 'react';
import useProduct from '../../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import { timeSince } from '../../../utils/time-since';
import { AutoFirewallStatus } from './auto-firewall-status';
import { InfoTooltip } from './info-tooltip';
import { ScanAndThreatStatus } from './scan-threats-status';
import { useProtectTooltipCopy } from './use-protect-tooltip-copy';
import type { TooltipContent } from './use-protect-tooltip-copy';
import type { FC } from 'react';

import './style.scss';

const ProtectValueSection = () => {
	const slug = 'protect';
	const { detail } = useProduct( slug );
	const { isPluginActive = false } = detail || {};
	const { plugins, themes, scanData } = getMyJetpackWindowInitialState();
	const {
		plugins: fromScanPlugins,
		themes: fromScanThemes,
		num_threats: numThreats = 0,
		last_checked: lastScanTime = null,
	} = scanData;

	const pluginsCount = fromScanPlugins.length || Object.keys( plugins ).length;
	const themesCount = fromScanThemes.length || Object.keys( themes ).length;

	const timeSinceLastScan = lastScanTime ? timeSince( Date.parse( lastScanTime ) ) : false;
	const lastScanText = useMemo( () => {
		if ( isPluginActive ) {
			if ( timeSinceLastScan ) {
				return sprintf(
					/* translators: %s is how long ago since the last scan took place, i.e.- "17 hours ago" */
					__( 'Last scan: %s', 'jetpack-my-jetpack' ),
					timeSinceLastScan
				);
			}
			return null;
		}
		return (
			sprintf(
				/* translators: %d is the number of plugins installed on the site. */
				_n( '%d plugin', '%d plugins', pluginsCount, 'jetpack-my-jetpack' ),
				pluginsCount
			) +
			' ' +
			/* translators: The ampersand symbol here (&) is meaning "and". */
			__( '&', 'jetpack-my-jetpack' ) +
			'\xa0' + // `\xa0` is a non-breaking space.
			sprintf(
				/* translators: %d is the number of themes installed on the site. */
				_n( '%d theme', '%d themes', themesCount, 'jetpack-my-jetpack' ).replace( ' ', '\xa0' ), // `\xa0` is a non-breaking space.
				themesCount
			)
		);
	}, [ isPluginActive, timeSinceLastScan, pluginsCount, themesCount ] );

	const tooltipContent = useProtectTooltipCopy( { pluginsCount, themesCount, numThreats } );

	return (
		<ValueSection
			isProtectActive={ isPluginActive }
			lastScanText={ lastScanText }
			tooltipContent={ tooltipContent }
		/>
	);
};

export default ProtectValueSection;

const ValueSection: FC< {
	isProtectActive: boolean;
	lastScanText?: string;
	tooltipContent: TooltipContent;
} > = ( { isProtectActive, lastScanText, tooltipContent } ) => {
	const { pluginsThemesTooltip } = tooltipContent;

	return (
		<>
			<div className="value-section__last-scan">
				{ lastScanText && <div>{ lastScanText }</div> }
				{ ! isProtectActive && (
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
					<div></div>
				</div>
			</div>
		</>
	);
};
