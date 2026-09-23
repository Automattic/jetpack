import { getBlockThemeMigration } from '../utils/block-theme-migration';
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
 * Whether the module's control is a plain on/off switch, rather than locked or a migration link.
 *
 * @param $module - The module.
 * @return Whether the module has a plain switch.
 */
export function hasPlainSwitch( $module: MyJetpackModule ): boolean {
	return ! $module.override && ! getBlockThemeMigration( $module );
}
