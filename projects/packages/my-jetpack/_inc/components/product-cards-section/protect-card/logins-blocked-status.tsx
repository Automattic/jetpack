import { __ } from '@wordpress/i18n';
import useProduct from '../../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import { isJetpackPluginActive } from '../../../utils/is-jetpack-plugin-active';
import ShieldOff from './assets/shield-off.svg';
import ShieldPartial from './assets/shield-partial.svg';
import { InfoTooltip } from './info-tooltip';
import { useProtectTooltipCopy } from './use-protect-tooltip-copy';
import type { ReactElement, PropsWithChildren } from 'react';

export const LoginsBlockedStatus = () => {
	const slug = 'protect';
	const { detail } = useProduct( slug );
	const { isPluginActive: isProtectPluginActive = false } = detail || {};
	const { isSiteConnected } = useMyJetpackConnection();
	const {
		protect: { wafConfig: wafData },
	} = getMyJetpackWindowInitialState();
	const { blocked_logins: blockedLoginsCount, brute_force_protection: hasBruteForceProtection } =
		wafData || {};

	// The Brute Force Protection module is available when either the Jetpack plugin Or the Protect plugin is active.
	const isPluginActive = isProtectPluginActive || isJetpackPluginActive();

	if ( isPluginActive && isSiteConnected ) {
		if ( hasBruteForceProtection ) {
			return <BlockedStatus status="active" />;
		}

		return <BlockedStatus status="inactive" />;
	}
	if ( isSiteConnected && blockedLoginsCount > 0 ) {
		// logins have been blocked previoulsy, but either the Jetpack or Protect plugin is not active
		return <BlockedStatus status="inactive" />;
	}
	return <BlockedStatus status="off" />;
};

/**
 * BlockedStatus component
 *
 * @param {PropsWithChildren}             props        - The component props
 * @param {'active' | 'inactive' | 'off'} props.status - The status of Brute Force Protection
 *
 * @return {ReactElement} rendered component
 */
function BlockedStatus( { status }: { status: 'active' | 'inactive' | 'off' } ) {
	const {
		protect: { wafConfig: wafData },
	} = getMyJetpackWindowInitialState();
	const { blocked_logins: blockedLoginsCount } = wafData || {};

	const tooltipContent = useProtectTooltipCopy();
	const { blockedLoginsTooltip } = tooltipContent;

	if ( status === 'active' ) {
		return blockedLoginsCount > 0 ? (
			<div className="logins_blocked__count">{ blockedLoginsCount }</div>
		) : (
			<>
				<div>
					<img
						className="value-section__status-icon"
						src={ ShieldPartial }
						alt={ __(
							'Shield icon - Brute Force Protection Status: Active',
							'jetpack-my-jetpack'
						) }
					/>
				</div>
				<InfoTooltip
					tracksEventName={ 'protect_card_tooltip_open' }
					tracksEventProps={ {
						location: 'blocked-logins',
						status: status,
						message: 'no data yet',
					} }
				>
					<>
						<h3 className="value-section__tooltip-heading">{ blockedLoginsTooltip.title }</h3>
						<p className="value-section__tooltip-content">{ blockedLoginsTooltip.text }</p>
					</>
				</InfoTooltip>
			</>
		);
	}
	if ( status === 'inactive' ) {
		return (
			<>
				{ blockedLoginsCount > 0 ? (
					<>
						<div>
							<img
								className="value-section__status-icon"
								src={ ShieldOff }
								alt={ __(
									'Shield icon - Brute Force Protection Status: Inactive',
									'jetpack-my-jetpack'
								) }
							/>
						</div>
						<div className="logins_blocked__count">{ blockedLoginsCount }</div>
					</>
				) : (
					<div>
						<img
							className="value-section__status-icon"
							src={ ShieldOff }
							alt={ __(
								'Shield icon - Brute Force Protection Status: Inactive',
								'jetpack-my-jetpack'
							) }
						/>
					</div>
				) }
				<InfoTooltip
					tracksEventName={ 'protect_card_tooltip_open' }
					tracksEventProps={ {
						location: 'blocked-logins',
						status: status,
					} }
				>
					<>
						<h3 className="value-section__tooltip-heading">{ blockedLoginsTooltip.title }</h3>
						<p className="value-section__tooltip-content">{ blockedLoginsTooltip.text }</p>
					</>
				</InfoTooltip>
			</>
		);
	}
	return (
		<>
			<div>
				<img
					className="value-section__status-icon"
					src={ ShieldOff }
					alt={ __( 'Shield icon - Brute Force Protection Status: Off', 'jetpack-my-jetpack' ) }
				/>
			</div>
			<div className="value-section__status-text">{ __( 'Off', 'jetpack-my-jetpack' ) }</div>
		</>
	);
}
