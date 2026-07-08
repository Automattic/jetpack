import getJetpackData from './get-jetpack-data';

interface BlockAvailability {
	available: boolean;
	unavailable_reason?: string;
	details?: Record< string, unknown >;
}

interface JetpackData {
	available_blocks?: Record< string, BlockAvailability >;
}

export interface ExtensionAvailability {
	available: boolean;
	details?: Record< string, unknown >;
	unavailableReason?: string;
}

/**
 * Return whether a Jetpack Gutenberg extension is available or not.
 *
 * @param {string} name - The extension's name (without the `jetpack/` prefix)
 * @return Object indicating if the extension is available and the reason why it is unavailable.
 */
export default function getJetpackExtensionAvailability( name: string ): ExtensionAvailability {
	const data = getJetpackData() as JetpackData | null;
	const available = data?.available_blocks?.[ name ]?.available ?? false;
	const unavailableReason = data?.available_blocks?.[ name ]?.unavailable_reason ?? 'unknown';
	const details = data?.available_blocks?.[ name ]?.details ?? {};
	return {
		available,
		...( ! available && { details, unavailableReason } ),
	};
}
