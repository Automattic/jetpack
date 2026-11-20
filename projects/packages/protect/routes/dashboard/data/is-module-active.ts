import type { ProtectSettings } from './use-protect-settings';

/**
 * A module's live on/off state: the Settings tab's value once loaded, else the page-load state.
 *
 * @param settings - Jetpack settings, or null while loading.
 * @param module   - Module slug.
 * @param fallback - The state from page load.
 * @return Whether the module is on.
 */
export default function isModuleActive(
	settings: ProtectSettings | null,
	module: string,
	fallback: boolean
): boolean {
	return typeof settings?.[ module ] === 'boolean' ? ( settings[ module ] as boolean ) : fallback;
}
