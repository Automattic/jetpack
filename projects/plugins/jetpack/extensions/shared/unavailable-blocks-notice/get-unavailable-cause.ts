import { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';

export type ModuleDetails = { module: string; module_name: string; forced: boolean };

export type UnavailableBlocksData = {
	reason?: 'not_connected' | 'blocks_module' | 'disabled' | null;
	canFix?: boolean;
	fixUrl?: string;
	features?: Record< string, ModuleDetails >;
	canManageModules: boolean;
	modulesUrl: string;
	independent?: string[];
	shipped?: string[];
};

export type UnavailableCause =
	| { type: 'not_connected' | 'blocks_module' | 'disabled' }
	| { type: 'feature'; name: string; forced: boolean };

/**
 * Get the inactive module a block reported when it declined to register.
 *
 * @param {string}                originalName - Name of the block that failed to load.
 * @param {UnavailableBlocksData} data         - What the server knows about unavailable blocks.
 * @return {ModuleDetails|undefined} The module, if the block named one.
 */
function getInactiveModule(
	originalName: string,
	data: UnavailableBlocksData
): ModuleDetails | undefined {
	if ( data.features?.[ originalName ] ) {
		return data.features[ originalName ];
	}

	const { unavailableReason, details } = getJetpackExtensionAvailability(
		originalName.replace( /^jetpack\//, '' )
	);
	return unavailableReason === 'missing_module' && details?.module
		? ( details as ModuleDetails )
		: undefined;
}

/**
 * Work out why Jetpack is not registering a block.
 *
 * @param {string}                originalName - Name of the block that failed to load.
 * @param {UnavailableBlocksData} data         - What the server knows about unavailable blocks.
 * @return {UnavailableCause|null} The cause, or null when it is not known.
 */
export default function getUnavailableCause(
	originalName: string | undefined,
	data: UnavailableBlocksData
): UnavailableCause | null {
	if ( ! originalName ) {
		return null;
	}

	// A form stays registered without the Blocks module, so only the other site-wide causes apply.
	const isExempt = data.reason === 'blocks_module' && !! data.independent?.includes( originalName );

	// Another plugin's block, or one Jetpack has removed, is not ours to explain.
	if ( data.reason && ! isExempt && data.shipped?.includes( originalName ) ) {
		return { type: data.reason };
	}

	const inactiveModule = getInactiveModule( originalName, data );
	return inactiveModule
		? { type: 'feature', name: inactiveModule.module_name, forced: inactiveModule.forced }
		: null;
}
