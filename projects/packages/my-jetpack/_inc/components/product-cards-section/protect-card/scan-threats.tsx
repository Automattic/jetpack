import { __ } from '@wordpress/i18n';
import useProduct from '../../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import ShieldOff from './assets/shield-off.svg';
import ShieldPartial from './assets/shield-partial.svg';
import ShieldSuccess from './assets/shield-success.svg';
import { InfoTooltip } from './info-tooltip';
import { useProtectTooltipCopy } from './use-protect-tooltip-copy';

export const ScanThreats = () => {
	const slug = 'protect';
	const { detail } = useProduct( slug );
	const { isPluginActive = false, hasPaidPlanForProduct: hasProtectPaidPlan } = detail || {};
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

	if ( isPluginActive ) {
		if ( hasProtectPaidPlan ) {
			if ( numThreats ) {
				// TODO: if ( has critical threats ) {
				// TODO: render the jsx here:
				return (
					<>
						<div className="value-section__heading">{ __( 'Threats', 'jetpack-my-jetpack' ) }</div>
						<div className="value-section__data">
							<div className="scan-threats__threat-count">{ numThreats }</div>
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
								src={ ShieldSuccess }
								alt={ __( 'Shield icon - Scan Status: Secure', 'jetpack-my-jetpack' ) }
							/>
						</div>
						<div className="value-section__status-text">Secure</div>
					</div>
				</>
			);
		}
		return numThreats ? (
			<>
				<div className="value-section__heading">{ __( 'Threats', 'jetpack-my-jetpack' ) }</div>
				<div className="value-section__data">
					<div className="scan-threats__threat-count">{ numThreats }</div>
				</div>
			</>
		) : (
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
					<div className="value-section__status-text">Partial</div>
					<InfoTooltip>
						<>
							<h3 className="value-section__tooltip-heading">{ scanThreatsTooltip.title }</h3>
							<p className="value-section__tooltip-content">{ scanThreatsTooltip.text }</p>
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
				<div className="value-section__status-text">Off</div>
			</div>
		</>
	);
};
