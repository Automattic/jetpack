import { __, _n, sprintf } from '@wordpress/i18n';
import { info } from '@wordpress/icons';
import { Button } from '@wordpress/ui';
import { useMemo } from 'react';
import {
	protectCardShieldOff as ShieldOff,
	protectCardShieldPartial as ShieldPartial,
	protectCardShieldSuccess as ShieldSuccess,
} from '../../../assets/inline-svgs';
import useProduct from '../../../data/products/use-product';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import { ProtectInfoPopover } from './info-popover';
import { useProtectTooltipCopy } from './use-protect-tooltip-copy';
import type { FC } from 'react';

interface ScanAndThreatStatusProps {
	data: ProtectData;
}

export const ScanAndThreatStatus: FC< ScanAndThreatStatusProps > = ( { data } ) => {
	const slug = 'protect';
	const { detail } = useProduct( slug );
	const { isPluginActive = false, hasPaidPlanForProduct: hasProtectPaidPlan } = detail || {};
	const { isSiteConnected } = useMyJetpackConnection();

	const { plugins, themes, num_threats: numThreats = 0 } = data?.scanData || {};

	const criticalScanThreatCount = useMemo( () => {
		const { core, database, files, num_plugins_threats, num_themes_threats } = data?.scanData || {};
		const pluginsThreats = num_plugins_threats
			? plugins.reduce( ( accum, plugin ) => accum.concat( plugin.threats ), [] )
			: [];
		const themesThreats = num_themes_threats
			? themes.reduce( ( accum, theme ) => accum.concat( theme.threats ), [] )
			: [];
		const allThreats = [
			...pluginsThreats,
			...themesThreats,
			...( core?.threats ?? [] ),
			...( database ?? [] ),
			...( files ?? [] ),
		];
		return allThreats.reduce(
			( accum, threat ) => ( threat.severity >= 5 ? accum + 1 : accum ),
			0
		);
	}, [ plugins, themes, data?.scanData ] );

	if ( isPluginActive && isSiteConnected ) {
		if ( hasProtectPaidPlan ) {
			if ( numThreats ) {
				return (
					<ThreatStatus
						data={ data }
						numThreats={ numThreats }
						criticalThreatCount={ criticalScanThreatCount }
					/>
				);
			}
			return <ScanStatus data={ data } status="success" />;
		}
		return numThreats ? (
			<ThreatStatus data={ data } numThreats={ numThreats } />
		) : (
			<ScanStatus data={ data } status="partial" />
		);
	}

	return <ScanStatus data={ data } status="off" />;
};

interface ThreatStatusProps {
	data: ProtectData;
	numThreats: number;
	criticalThreatCount?: number;
}

const ThreatStatus: FC< ThreatStatusProps > = ( { data, numThreats, criticalThreatCount } ) => {
	const tooltipContent = useProtectTooltipCopy( data );
	const { scanThreatsTooltip } = tooltipContent;

	if ( criticalThreatCount ) {
		return (
			<>
				<div className="value-section__heading">
					{ __( 'Threats', 'jetpack-my-jetpack' ) }
					<ProtectInfoPopover
						label={ __( 'Threats', 'jetpack-my-jetpack' ) }
						title={ scanThreatsTooltip.title }
						text={ scanThreatsTooltip.text }
						tracksEventProps={ {
							location: 'scan',
							has_paid_plan: true,
							threats: numThreats,
						} }
						trigger={
							<Button
								variant="unstyled"
								className="my-jetpack-info-popover__trigger my-jetpack-info-popover__trigger--critical"
								aria-label={ sprintf(
									/* translators: %d is the number of critical threats found by the last scan. */
									_n(
										'%d critical threat. More about threats',
										'%d critical threats. More about threats',
										criticalThreatCount,
										'jetpack-my-jetpack'
									),
									criticalThreatCount
								) }
							>
								<Button.Icon icon={ info } />
								{ criticalThreatCount }
							</Button>
						}
					/>
				</div>
				<div className="value-section__data">
					<div className="scan-threats__threat-count">{ numThreats }</div>
				</div>
			</>
		);
	}

	return (
		<>
			<div className="value-section__heading">
				{ __( 'Threats', 'jetpack-my-jetpack' ) }
				<ProtectInfoPopover
					label={ __( 'Threats', 'jetpack-my-jetpack' ) }
					title={ scanThreatsTooltip.title }
					text={ scanThreatsTooltip.text }
					tracksEventProps={ {
						location: 'threats',
						has_paid_plan: true,
						threats: numThreats,
					} }
				/>
			</div>
			<div className="value-section__data">
				<div className="scan-threats__threat-count">{ numThreats }</div>
			</div>
		</>
	);
};

interface ScanStatusProps {
	data: ProtectData;
	status: 'success' | 'partial' | 'off';
}

const ScanStatus: FC< ScanStatusProps > = ( { data, status } ) => {
	const tooltipContent = useProtectTooltipCopy( data );
	const { scanThreatsTooltip } = tooltipContent;

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
				<div className="value-section__heading">
					{ __( 'Scan', 'jetpack-my-jetpack' ) }
					<ProtectInfoPopover
						label={ __( 'Scan', 'jetpack-my-jetpack' ) }
						title={ scanThreatsTooltip.title }
						text={ scanThreatsTooltip.text }
						tracksEventProps={ {
							location: 'scan',
							status: status,
							has_paid_plan: false,
							threats: 0,
						} }
					/>
				</div>
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
};
