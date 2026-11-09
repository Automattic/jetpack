import { getScriptData } from '@automattic/jetpack-script-data';

type MonetizeScriptData = { monetize?: { sections?: Record< string, unknown > } };

/**
 * The state PHP added for a section to `JetpackScriptData.monetize.sections`.
 *
 * @param key - The section's key.
 * @return The section's state, or undefined when the section isn't registered.
 */
export function getSectionState< T >( key: string ): T | undefined {
	return ( getScriptData() as MonetizeScriptData | undefined )?.monetize?.sections?.[ key ] as
		T | undefined;
}
