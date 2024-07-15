import { Gridicon } from '@automattic/jetpack-components';
import { Popover } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { useMemo, useState, useCallback, useRef } from 'react';
import useProduct from '../../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../../hooks/use-analytics';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import ShieldOff from './assets/shield-off.svg';
import ShieldPartial from './assets/shield-partial.svg';
import ShieldSuccess from './assets/shield-success.svg';
import { InfoTooltip } from './info-tooltip';
import { useProtectTooltipCopy, type TooltipContent } from './use-protect-tooltip-copy';
import type { ReactElement, PropsWithChildren } from 'react';

export const ScanAndThreatStatus = () => {
	const slug = 'protect';
	const { detail } = useProduct( slug );
	const { isPluginActive = false, hasPaidPlanForProduct: hasProtectPaidPlan } = detail || {};
	const { isSiteConnected } = useMyJetpackConnection();
	const { plugins, themes, scanData } = getMyJetpackWindowInitialState();
	const {
		plugins: fromScanPlugins,
		themes: fromScanThemes,
		num_threats: numThreats = 0,
	} = scanData;

	const pluginsCount = fromScanPlugins.length || Object.keys( plugins ).length;
	const themesCount = fromScanThemes.length || Object.keys( themes ).length;
	const tooltipContent = useProtectTooltipCopy( { pluginsCount, themesCount, numThreats } );
	const { scanThreatsTooltip } = tooltipContent;

	const criticalScanThreatCount = useMemo( () => {
		const { core, database, files, num_plugins_threats, num_themes_threats } = scanData;
		const pluginsThreats = num_plugins_threats
			? fromScanPlugins.reduce( ( accum, plugin ) => accum.concat( plugin.threats ), [] )
			: [];
		const themesThreats = num_themes_threats
			? fromScanThemes.reduce( ( accum, theme ) => accum.concat( theme.threats ), [] )
			: [];
		const allThreats = [
			...pluginsThreats,
			...themesThreats,
			...( core?.threats ?? [] ),
			...database,
			...files,
		];
		return allThreats.reduce(
			( accum, threat ) => ( threat.severity >= 5 ? ( accum += 1 ) : accum ),
			0
		);
	}, [ fromScanPlugins, fromScanThemes, scanData ] );

	if ( isPluginActive && isSiteConnected ) {
		if ( hasProtectPaidPlan ) {
			if ( numThreats ) {
				return (
					<ThreatStatus
						numThreats={ numThreats }
						criticalThreatCount={ criticalScanThreatCount }
						tooltipContent={ scanThreatsTooltip }
					/>
				);
			}
			return <ScanStatus status="success" tooltipContent={ scanThreatsTooltip } />;
		}
		return numThreats ? (
			<ThreatStatus numThreats={ numThreats } tooltipContent={ scanThreatsTooltip } />
		) : (
			<ScanStatus status="partial" tooltipContent={ scanThreatsTooltip } />
		);
	}

	return <ScanStatus status="off" tooltipContent={ scanThreatsTooltip } />;
};

/**
 * ThreatStatus component
 *
 * @param {PropsWithChildren} props - The component props
 * @param {number} props.numThreats - The number of threats
 * @param {number} props.criticalThreatCount - The number of critical threats
 * @param {TooltipContent[ 'scanThreatsTooltip' ]} props.tooltipContent - The number of critical threats
 * @returns {ReactElement} rendered component
 */
function ThreatStatus( {
	numThreats,
	criticalThreatCount,
	tooltipContent,
}: {
	numThreats: number;
	criticalThreatCount?: number;
	tooltipContent?: TooltipContent[ 'scanThreatsTooltip' ];
} ) {
	const { recordEvent } = useAnalytics();
	const useTooltipRef = useRef< HTMLButtonElement >();
	const isMobileViewport: boolean = useViewportMatch( 'medium', '<' );
	const [ isPopoverVisible, setIsPopoverVisible ] = useState( false );

	const toggleTooltip = useCallback(
		() =>
			setIsPopoverVisible( prevState => {
				if ( ! prevState === true ) {
					recordEvent( 'jetpack_protect_card_tooltip_open', {
						page: 'my-jetpack',
						feature: 'jetpack-protect',
						location: 'scan',
						status: 'alert',
						hasPaidPlan: true,
						threats: numThreats,
					} );
				}
				return ! prevState;
			} ),
		[ numThreats, recordEvent ]
	);
	const hideTooltip = useCallback( () => {
		// Don't hide the tooltip here if it's the tooltip button that was clicked (the button
		// becoming the document's activeElement). Instead let toggleTooltip() handle the closing.
		if ( useTooltipRef.current && ! useTooltipRef.current.contains( document.activeElement ) ) {
			setIsPopoverVisible( false );
		}
	}, [ setIsPopoverVisible, useTooltipRef ] );

	if ( criticalThreatCount ) {
		return (
			<>
				<div className="value-section__heading">{ __( 'Threats', 'jetpack-my-jetpack' ) }</div>
				<div className="value-section__data">
					<div className="scan-threats__critical-threats">
						<div className="scan-threats__threat-count">{ numThreats }</div>
						<div className="scan-threats__critical-threat-container">
							<button
								className="info-tooltip__button"
								onClick={ toggleTooltip }
								ref={ useTooltipRef }
							>
								<Gridicon className="scan_threats__icon-critical" icon="info" size={ 14 } />
								<span className="scan-threats__critical-threat-count">{ criticalThreatCount }</span>
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
										<h3 className="value-section__tooltip-heading">{ tooltipContent.title }</h3>
										<p className="value-section__tooltip-content">{ tooltipContent.text }</p>
									</>
								</Popover>
							) }
						</div>
					</div>
				</div>
			</>
		);
	}

	return (
		<>
			<div className="value-section__heading">{ __( 'Threats', 'jetpack-my-jetpack' ) }</div>
			<div className="value-section__data">
				<div className="scan-threats__threat-count">{ numThreats }</div>
			</div>
		</>
	);
}

/**
 * ScanStatus component
 *
 * @param {PropsWithChildren} props - The component props
 * @param {'success' | 'partial' | 'off'} props.status - The number of threats
 * @param {TooltipContent[ 'scanThreatsTooltip' ]} props.tooltipContent - The number of critical threats
 * @returns { ReactElement} rendered component
 */
function ScanStatus( {
	status,
	tooltipContent,
}: {
	status: 'success' | 'partial' | 'off';
	tooltipContent?: TooltipContent[ 'scanThreatsTooltip' ];
} ) {
	if ( status === 'success' ) {
		return (
			<>
				<div className="value-section__heading">{ __( 'Scan', 'jetpack-my-jetpack' ) }</div>
				<div className="value-section__data">
					<div>
						<img
							className="value-section__status-icon"
							src={ ShieldSuccess }
							alt={ __( 'Shield icon - Scan Status: Secure', 'jetpack-my-jetpack' ) }
						/>
					</div>
					<div className="value-section__status-text">{ __( 'Secure', 'jetpack-my-jetpack' ) }</div>
				</div>
			</>
		);
	}
	if ( status === 'partial' ) {
		return (
			<>
				<div className="value-section__heading">{ __( 'Scan', 'jetpack-my-jetpack' ) }</div>
				<div className="value-section__data">
					<div>
						<img
							className="value-section__status-icon"
							src={ ShieldPartial }
							alt={ __( 'Shield icon - Scan Status: Partial', 'jetpack-my-jetpack' ) }
						/>
					</div>
					<div className="value-section__status-text">
						{ __( 'Partial', 'jetpack-my-jetpack' ) }
					</div>
					<InfoTooltip
						tracksEventName={ 'protect_card_tooltip_open' }
						tracksEventProps={ {
							location: 'scan',
							status: 'partial',
							hasPaidPlan: false,
							threats: 0,
						} }
					>
						<>
							<h3 className="value-section__tooltip-heading">{ tooltipContent.title }</h3>
							<p className="value-section__tooltip-content">{ tooltipContent.text }</p>
						</>
					</InfoTooltip>
				</div>
			</>
		);
	}
	return (
		<>
			<div className="value-section__heading">{ __( 'Scan', 'jetpack-my-jetpack' ) }</div>
			<div className="value-section__data">
				<div>
					<img
						className="value-section__status-icon"
						src={ ShieldOff }
						alt={ __( 'Shield icon - Scan Status: Off', 'jetpack-my-jetpack' ) }
					/>
				</div>
				<div className="value-section__status-text">{ __( 'Off', 'jetpack-my-jetpack' ) }</div>
			</div>
		</>
	);
}
