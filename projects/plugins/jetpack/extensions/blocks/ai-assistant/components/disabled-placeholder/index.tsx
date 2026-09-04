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

	const instructions =
		gate === 'writing_assistant'
			? __(
					'The Writing Assistant is turned off for this site, so this block cannot be used. You can leave it here or remove it.',
					'jetpack'
			  )
			: __(
					'Jetpack AI is turned off for this site, so this block cannot be used. You can leave it here or remove it.',
					'jetpack'
			  );

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
