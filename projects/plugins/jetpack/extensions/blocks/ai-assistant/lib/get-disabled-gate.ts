import type { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';

type ExtensionAvailability = ReturnType< typeof getJetpackExtensionAvailability >;

/**
 * The `unavailable_reason` the server reports when the block is missing
 * only because a Jetpack AI setting is switched off.
 */
export const AI_DISABLED_REASON = 'ai_disabled';

/**
 * Which setting switched the block off.
 */
export type DisabledGate = 'master' | 'writing_assistant';

/**
 * Work out whether the AI Assistant block is unavailable because a Jetpack AI
 * setting is off, and if so which one.
 *
 * Any other reason (offline mode, missing module, missing plan, and so on)
 * returns null so the block follows the standard registration path.
 *
 * @param {ExtensionAvailability} availability - The block's availability from the editor's initial state.
 * @return {DisabledGate | null} The setting that switched the block off, or null.
 */
export function getDisabledGate( availability: ExtensionAvailability ): DisabledGate | null {
	if ( availability.available || availability.unavailableReason !== AI_DISABLED_REASON ) {
		return null;
	}

	return availability.details?.gate === 'writing_assistant' ? 'writing_assistant' : 'master';
}
