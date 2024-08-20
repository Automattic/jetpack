import { numberFormat } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import useProduct from '../../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import { isJetpackPluginActive } from '../../../utils/is-jetpack-plugin-active';
import { InfoTooltip } from '../../info-tooltip';
import ShieldOff from './assets/shield-off.svg';
import ShieldPartial from './assets/shield-partial.svg';
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

	const blockedLoginsFontSize = useMemo( () => {
		switch ( true ) {
			case blockedLoginsCount > 99999:
				return 20;
			case blockedLoginsCount > 9999:
				return 24;
			case blockedLoginsCount > 999:
				return 28;
			default:
				return 36;
		}
	}, [ blockedLoginsCount ] );

	const blockedLoginsStyle = {
		letterSpacing: '-1px',
		fontSize: `${ blockedLoginsFontSize }px`,
	};

	if ( status === 'active' ) {
		return blockedLoginsCount > 0 ? (
			<div
				className="logins_blocked__count"
				style={ blockedLoginsFontSize < 36 ? blockedLoginsStyle : {} }
			>
				{ numberFormat( blockedLoginsCount ) }
			</div>
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
						feature: 'jetpack-protect',
						message: 'no data yet',
					} }
				>
					<>
						<h3>{ blockedLoginsTooltip.title }</h3>
						<p>{ blockedLoginsTooltip.text }</p>
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
						<div
							className="logins_blocked__count"
							style={ blockedLoginsFontSize < 36 ? blockedLoginsStyle : {} }
						>
							{ numberFormat( blockedLoginsCount ) }
						</div>
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
						feature: 'jetpack-protect',
						status: status,
					} }
				>
					<>
						<h3>{ blockedLoginsTooltip.title }</h3>
						<p>{ blockedLoginsTooltip.text }</p>
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
