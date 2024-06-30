import { Gridicon } from '@automattic/jetpack-components';
import { Popover } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { useState, useCallback } from 'react';
import useProduct from '../../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import { timeSince } from '../../../utils/time-since';
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

	const timeSinceLastScan = lastScanTime ? timeSince( Date.parse( lastScanTime ) ) : '...';
	const lastScanText = isPluginActive
		? sprintf(
				/* translators: %s is how long ago since the last scan took place, i.e.- "17 hours ago" */
				__( 'Last scan: %s', 'jetpack-my-jetpack' ),
				timeSinceLastScan
		  )
		: sprintf(
				/* translators: %1$d is the number (integer) of plugins and %2$d is the number (integer) of themes the site has. */
				__( '%1$s plugins & %2$s themes', 'jetpack-my-jetpack' ),
				pluginsCount,
				themesCount
		  );
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
	lastScanText: string;
	tooltipContent: TooltipContent;
} > = ( { isProtectActive, lastScanText, tooltipContent } ) => {
	const isMobileViewport: boolean = useViewportMatch( 'medium', '<' );
	const [ isPopoverVisible, setIsPopoverVisible ] = useState( false );
	// TODO: `scanThreatsTooltip` will be utilized in a followup PR.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { pluginsThemesTooltip, scanThreatsTooltip } = tooltipContent;

	const toggleTooltip = useCallback(
		() => setIsPopoverVisible( prevState => ! prevState ),
		[ setIsPopoverVisible ]
	);
	const hideTooltip = useCallback( () => setIsPopoverVisible( false ), [ setIsPopoverVisible ] );

	return (
		<>
			<div className="value-section__last-scan">
				<div>{ lastScanText }</div>
				{ ! isProtectActive && (
					<div>
						<button className="value-section__tooltip-button" onClick={ toggleTooltip }>
							<Gridicon icon="info-outline" size={ 14 } />
						</button>
						{ isPopoverVisible && (
							<Popover
								placement={ isMobileViewport ? 'top-end' : 'right' }
								noArrow={ false }
								offset={ 10 }
								focusOnMount={ 'container' }
								onClose={ hideTooltip }
							>
								<>
									<h3 className="value-section__tooltip-heading">{ pluginsThemesTooltip.title }</h3>
									<p className="value-section__tooltip-content">{ pluginsThemesTooltip.text }</p>
								</>
							</Popover>
						) }
					</div>
				) }
			</div>
			<div className="value-section">
				<div className="value-section__scan-threats">
					<div className="value-section__heading">Scan</div>
					<div></div>
				</div>
				<div className="value-section__auto-firewall">
					<div className="value-section__heading">Auto-Firewall</div>
					<div></div>
				</div>
				<div className="value-section__logins-blocked">
					<div className="value-section__heading">Logins Blocked</div>
					<div></div>
				</div>
			</div>
		</>
	);
};
