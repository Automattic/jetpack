import { formatNumberCompact } from '@automattic/number-formatters';
import { __ } from '@wordpress/i18n';
import {
	protectCardShieldOff as ShieldOff,
	protectCardShieldPartial as ShieldPartial,
} from '../../../assets/inline-svgs';
import useProduct from '../../../data/products/use-product';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import { isJetpackPluginActive } from '../../../utils/is-jetpack-plugin-active';
import { ProtectInfoPopover } from './info-popover';
import { useProtectTooltipCopy } from './use-protect-tooltip-copy';
import type { FC } from 'react';

interface LoginsBlockedStatusProps {
	data: ProtectData;
}

export const LoginsBlockedStatus: FC< LoginsBlockedStatusProps > = ( { data } ) => {
	const slug = 'protect';
	const { detail } = useProduct( slug );
	const { isPluginActive: isProtectPluginActive = false } = detail || {};
	const { isSiteConnected } = useMyJetpackConnection();
	const { blocked_logins: blockedLoginsCount, brute_force_protection: hasBruteForceProtection } =
		data?.wafConfig || {};

	// The Brute Force Protection module is available when either the Jetpack plugin Or the Protect plugin is active.
	const isPluginActive = isProtectPluginActive || isJetpackPluginActive();

	if ( isPluginActive && isSiteConnected ) {
		if ( hasBruteForceProtection ) {
			return <BlockedStatus data={ data } status="active" />;
		}

		return <BlockedStatus data={ data } status="inactive" />;
	}
	if ( isSiteConnected && blockedLoginsCount > 0 ) {
		// logins have been blocked previoulsy, but either the Jetpack or Protect plugin is not active
		return <BlockedStatus data={ data } status="inactive" />;
	}
	return <BlockedStatus data={ data } status="off" />;
};

interface BlockedStatusProps {
	status: 'active' | 'inactive' | 'off';
	data: ProtectData;
}

const BlockedStatus: FC< BlockedStatusProps > = ( { status, data } ) => {
	const { blocked_logins: blockedLoginsCount } = data?.wafConfig || {};

	const tooltipContent = useProtectTooltipCopy( data );
	const { blockedLoginsTooltip } = tooltipContent;

	if ( status === 'active' ) {
		return blockedLoginsCount > 0 ? (
			<>
				<div className="value-section__heading">
					{ __( 'Logins Blocked', 'jetpack-my-jetpack' ) }
				</div>
				<div className="value-section__data">
					<div className="logins_blocked__count">{ formatNumberCompact( blockedLoginsCount ) }</div>
				</div>
			</>
		) : (
			<>
				<div className="value-section__heading">
					{ __( 'Logins Blocked', 'jetpack-my-jetpack' ) }
					<ProtectInfoPopover
						label={ __( 'Logins Blocked', 'jetpack-my-jetpack' ) }
						title={ blockedLoginsTooltip.title }
						text={ blockedLoginsTooltip.text }
						tracksEventProps={ {
							location: 'blocked-logins',
							status: status,
							message: 'no data yet',
						} }
					/>
				</div>
				<div className="value-section__data">
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
					<div className="logins_blocked__count">{ formatNumberCompact( 0 ) }</div>
				</div>
			</>
		);
	}
	if ( status === 'inactive' ) {
		return (
			<>
				<div className="value-section__heading">
					{ __( 'Logins Blocked', 'jetpack-my-jetpack' ) }
					<ProtectInfoPopover
						label={ __( 'Logins Blocked', 'jetpack-my-jetpack' ) }
						title={ blockedLoginsTooltip.title }
						text={ blockedLoginsTooltip.text }
						tracksEventProps={ {
							location: 'blocked-logins',
							status: status,
						} }
					/>
				</div>
				<div className="value-section__data">
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
							<div className="logins_blocked__count">
								{ formatNumberCompact( blockedLoginsCount ) }
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
				</div>
			</>
		);
	}
	return (
		<>
			<div className="value-section__heading">{ __( 'Logins Blocked', 'jetpack-my-jetpack' ) }</div>
			<div className="value-section__data">
				<div>
					<img
						className="value-section__status-icon"
						src={ ShieldOff }
						alt={ __( 'Shield icon - Brute Force Protection Status: Off', 'jetpack-my-jetpack' ) }
					/>
				</div>
				<div className="value-section__status-text">{ __( 'Off', 'jetpack-my-jetpack' ) }</div>
			</div>
		</>
	);
};
