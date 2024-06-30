import { Gridicon } from '@automattic/jetpack-components';
import { Popover } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { useState } from 'react';
import useProduct from '../../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import { timeSince } from '../../../utils/time-since';
import type { FC } from 'react';

import './style.scss';

const ProtectValueSection = () => {
	const slug = 'protect';
	const { detail } = useProduct( slug );
	const { isPluginActive = false } = detail || {};

	return isPluginActive ? <WithProtectValueSection /> : <NoProtectValueSection />;
};

export default ProtectValueSection;

const WithProtectValueSection = () => {
	const { protectStatus } = getMyJetpackWindowInitialState();
	const lastScanTime = protectStatus?.last_checked;
	const timeSinceLastScan = lastScanTime ? timeSince( Date.parse( lastScanTime ) ) : '...';

	const lastScanText = sprintf(
		/* translators: %s is how long ago since the last scan took place, i.e.- "17 hours ago" */
		__( 'Last scan: %s', 'jetpack-my-jetpack' ),
		timeSinceLastScan
	);
	return <ValueSection isProtectActive={ true } lastScanText={ lastScanText } />;
};

const NoProtectValueSection = () => {
	const { plugins, themes } = getMyJetpackWindowInitialState();
	const pluginsCount = Object.keys( plugins ).length;
	const themesCount = Object.keys( themes ).length;

	const pluginsThemesText = sprintf(
		/* translators: %1$d is the number (integer) of plugins and %2$d is the number (integer) of themes the site has. */
		__( '%1$s plugins & %2$s themes', 'jetpack-my-jetpack' ),
		pluginsCount,
		themesCount
	);

	return <ValueSection isProtectActive={ false } lastScanText={ pluginsThemesText } />;
};

const ValueSection: FC< {
	isProtectActive: boolean;
	lastScanText: string;
} > = ( { isProtectActive, lastScanText } ) => {
	const isMobileViewport: boolean = useViewportMatch( 'medium', '<' );
	const [ isVisiblePopover_PluginsThemes, setIsVisiblePopover_PluginsThemes ] = useState( false );

	const togglePopover_PluginsThemes = function () {
		setIsVisiblePopover_PluginsThemes( state => ! state );
	};

	return (
		<>
			<div className="value-section__last-scan">
				<span>{ lastScanText }</span>
				{ ! isProtectActive && (
					<span>
						<button
							className="value-section__tooltip-button"
							// eslint-disable-next-line react/jsx-no-bind
							onClick={ togglePopover_PluginsThemes }
						>
							<Gridicon icon="info-outline" size={ 14 } />
							{ isVisiblePopover_PluginsThemes && (
								<Popover
									placement={ isMobileViewport ? 'top-end' : 'right' }
									noArrow={ false }
									offset={ 10 }
								>
									<p className="value-section__tooltip-heading">
										{ __( 'Improve site safety: secure plugins & themes', 'jetpack-my-jetpack' ) }
									</p>
									<p className="value-section__tooltip-content">
										{ __(
											'Your site has 14 plugins and 3 themes lacking security measures. Improve your site’s safety by adding protection at no cost.',
											'jetpack-my-jetpack'
										) }
									</p>
								</Popover>
							) }
						</button>
					</span>
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
