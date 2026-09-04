/**
 * External dependencies
 */
import { aiAssistantIcon } from '@automattic/jetpack-ai-client';
import { getAdminUrl, getScriptData } from '@automattic/jetpack-script-data';
import { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';
import { useBlockProps } from '@wordpress/block-editor';
import { Button, Placeholder } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { getDisabledGate } from '../../lib/get-disabled-gate';

const AI_SETTINGS_PATH = 'admin.php?page=jetpack-ai#/features';

/**
 * One message per gate. Kept as separate `__()` calls in an object rather
 * than a ternary so the minifier cannot fold them into a single call with a
 * non-literal message, which breaks translation extraction.
 *
 * @param {DisabledGate | null} gate - The setting that switched the block off.
 * @return {string} The message to show in the placeholder.
 */
const getInstructions = ( gate: ReturnType< typeof getDisabledGate > ) => {
	const messages = {
		writing_assistant: __(
			'The Writing Assistant is turned off for this site, so this block cannot be used. You can leave it here or remove it.',
			'jetpack'
		),
		master: __(
			'Jetpack AI is turned off for this site, so this block cannot be used. You can leave it here or remove it.',
			'jetpack'
		),
	};

	return messages[ gate ?? 'master' ];
};

/**
 * Shown in place of the AI Assistant block when Jetpack AI, or the Writing
 * Assistant, is switched off for the site. Tells the author why the block is
 * inert and, for users who can change the setting, links to it.
 *
 * @return {JSX.Element} The placeholder.
 */
export default function DisabledPlaceholder() {
	const blockProps = useBlockProps();
	const gate = getDisabledGate( getJetpackExtensionAvailability( 'ai-assistant' ) );
	const canManageSettings =
		getScriptData()?.user?.current_user?.capabilities?.manage_options ?? false;

	const instructions = getInstructions( gate );

	return (
		<div { ...blockProps }>
			<Placeholder
				icon={ aiAssistantIcon }
				label={ __( 'AI Assistant', 'jetpack' ) }
				instructions={ instructions }
			>
				{ canManageSettings && (
					<Button variant="secondary" href={ getAdminUrl( AI_SETTINGS_PATH ) }>
						{ __( 'Manage AI settings', 'jetpack' ) }
					</Button>
				) }
			</Placeholder>
		</div>
	);
}
