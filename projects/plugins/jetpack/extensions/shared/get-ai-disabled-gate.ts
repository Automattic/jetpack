import type { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';

type ExtensionAvailability = ReturnType< typeof getJetpackExtensionAvailability >;

/**
 * The `unavailable_reason` the server reports when a block is missing only
 * because a Jetpack AI setting is switched off.
 */
export const AI_DISABLED_REASON = 'ai_disabled';

/**
 * Which setting switched the block off.
 */
export type AiDisabledGate = 'master' | 'writing_assistant';

/**
 * Work out whether a block is unavailable because a Jetpack AI setting is
 * off, and if so which one. Any other reason returns null.
 *
 * Callers still register such a block, hidden from the inserter, so saved
 * copies show why it is off instead of core's "unsupported block" warning.
 *
 * @param {ExtensionAvailability} availability - The block's availability from the editor's initial state.
 * @return {AiDisabledGate | null} The setting that switched the block off, or null.
 */
export function getAiDisabledGate( availability: ExtensionAvailability ): AiDisabledGate | null {
	if ( availability.available || availability.unavailableReason !== AI_DISABLED_REASON ) {
		return null;
	}

	return availability.details?.gate === 'writing_assistant' ? 'writing_assistant' : 'master';
}
