export type UnavailableBlocksData = {
	reason: 'not_connected' | 'blocks_module' | 'disabled' | null;
	canFix: boolean;
	fixUrl: string;
	features: Record< string, { name: string; forced: boolean } >;
	canManageModules: boolean;
	modulesUrl: string;
	independent: string[];
	ignored: string[];
};

export type UnavailableCause =
	| { type: 'not_connected' | 'blocks_module' | 'disabled' }
	| { type: 'feature'; name: string; forced: boolean };

const NAMESPACES = [ 'jetpack/', 'videopress/', 'premium-content/' ];

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
	if (
		! originalName ||
		! NAMESPACES.some( namespace => originalName.startsWith( namespace ) ) ||
		data.ignored.includes( originalName )
	) {
		return null;
	}

	const feature = data.features[ originalName ];
	const featureCause: UnavailableCause | null = feature ? { type: 'feature', ...feature } : null;

	// Their own packages register these, so the Blocks module being off does not explain them.
	if ( data.independent.includes( originalName ) ) {
		if ( featureCause ) {
			return featureCause;
		}
		return data.reason && data.reason !== 'blocks_module' ? { type: data.reason } : null;
	}

	return data.reason ? { type: data.reason } : featureCause;
}
