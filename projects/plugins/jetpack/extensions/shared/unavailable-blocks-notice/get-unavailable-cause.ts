export type UnavailableBlocksData = {
	reason: 'not_connected' | 'blocks_module' | 'disabled' | null;
	canFix: boolean;
	fixUrl: string;
	features: Record< string, { name: string; forced: boolean } >;
	canManageModules: boolean;
	modulesUrl: string;
	independent: string[];
	shipped: string[];
};

export type UnavailableCause =
	| { type: 'not_connected' | 'blocks_module' | 'disabled' }
	| { type: 'feature'; name: string; forced: boolean };

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
	const isExempt = data.reason === 'blocks_module' && data.independent.includes( originalName );

	// Another plugin's block, or one Jetpack has removed, is not ours to explain.
	if ( data.reason && ! isExempt && data.shipped.includes( originalName ) ) {
		return { type: data.reason };
	}

	const feature = data.features[ originalName ];
	return feature ? { type: 'feature', ...feature } : null;
}
