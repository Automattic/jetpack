/**
 * External dependencies
 */
import { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import AiDisabledPlaceholder from '../../../../shared/components/ai-disabled-placeholder';
import { getAiDisabledGate } from '../../../../shared/get-ai-disabled-gate';

/**
 * Stands in for the AI Assistant block while Jetpack AI, or the Writing
 * Assistant, is switched off for the site.
 *
 * @return {JSX.Element} The placeholder.
 */
export default function DisabledEdit() {
	const gate = getAiDisabledGate( getJetpackExtensionAvailability( 'ai-assistant' ) );

	// Separate `__()` calls in a lookup, not a ternary, so the minifier cannot
	// fold them into one call with a non-literal message and break translation
	// extraction.
	const messages = {
		writing_assistant: __(
			'The Writing Assistant is turned off for this site, so this block can’t generate content. Turn the Writing Assistant on in Jetpack AI settings to use it again.',
			'jetpack'
		),
		master: __(
			'Jetpack AI is turned off for this site, so this block can’t generate content. Turn Jetpack AI on to use it again.',
			'jetpack'
		),
	};

	return (
		<AiDisabledPlaceholder
			label={ __( 'AI Assistant', 'jetpack' ) }
			instructions={ messages[ gate ?? 'master' ] }
		/>
	);
}
