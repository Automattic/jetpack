import apiFetch from '@wordpress/api-fetch';
import { getBlockThemeMigration } from '../utils/block-theme-migration';
import { getProtectPageUrl } from '../utils/protect-page';
import { isSettingsConsolidationEnabled } from '../utils/settings-consolidation';
import { queueActivationRequest } from './queue-activation-request';
import {
	clearRequestedSwitch,
	moduleSwitchKey,
	setRequestedSwitch,
} from './requested-switch-state';
import type { MyJetpackModule } from '../types';

/**
 * Send one module switch through the activation queue, holding the asked-for value meanwhile.
 *
 * @param toggleModule - The modules store's `updateJetpackModuleStatus` action.
 * @param slug         - The module's slug.
 * @param active       - The asked-for value.
 * @return Whether the switch succeeded.
 */
export function requestModuleSwitch(
	toggleModule: ( args: { name: string; active: boolean } ) => Promise< unknown >,
	slug: string,
	active: boolean
): Promise< boolean > {
	const key = moduleSwitchKey( slug );
	const token = setRequestedSwitch( key, active );

	return (
		queueActivationRequest( () => toggleModule( { name: slug, active } ) )
			// The queue gives up on a request that never answers. Treated as a failure
			// so the switch explains itself rather than silently going back.
			.then( Boolean, () => false )
			.finally( () => clearRequestedSwitch( key, token ) )
	);
}

/**
 * Whether switching the module off first checks for Blaze campaigns, which keep serving ads, and billing.
 *
 * Behind the settings flag.
 *
 * @param $module - The module.
 * @return Whether switching it off may stop to ask.
 */
export function asksBeforeSwitchingOff( $module: MyJetpackModule ): boolean {
	return $module.module === 'blaze' && isSettingsConsolidationEnabled();
}

/**
 * Whether Blaze campaigns may still be running, counting an unknown status or a failed request as yes.
 *
 * @return False only when Blaze says no campaign is running.
 */
export async function mayHaveRunningCampaigns(): Promise< boolean > {
	try {
		const campaigns = await apiFetch< { status?: string } >( {
			path: '/jetpack/v4/blaze/active-campaigns',
		} );
		return campaigns?.status !== 'none';
	} catch {
		return true;
	}
}

/**
 * Whether the module's control is a plain on/off switch, rather than locked, a link elsewhere, or one that asks first.
 *
 * @param $module - The module.
 * @return Whether the module has a plain switch.
 */
export function hasPlainSwitch( $module: MyJetpackModule ): boolean {
	return (
		! $module.override &&
		! getBlockThemeMigration( $module ) &&
		! getProtectPageUrl( $module.module ) &&
		! ( $module.activated && asksBeforeSwitchingOff( $module ) )
	);
}
