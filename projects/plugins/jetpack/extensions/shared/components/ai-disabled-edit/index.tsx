import { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';
import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

type Props = {
	name: 'jetpack/ai-assistant' | 'jetpack/ai-chat';
};

/**
 * Show a placeholder for a saved AI block when AI is off.
 *
 * @param {Props}  props      - Block editor props.
 * @param {string} props.name - Registered block name.
 * @return {JSX.Element} The placeholder.
 */
export default function AiDisabledEdit( { name }: Props ) {
	const writingAssistantDisabled =
		name === 'jetpack/ai-assistant' &&
		getJetpackExtensionAvailability( 'ai-assistant' ).details?.feature === 'writing_assistant';
	const { label, instructions } = {
		'jetpack/ai-assistant': {
			label: __( 'AI Assistant', 'jetpack' ),
			instructions: __(
				'Jetpack AI is disabled so this block can’t generate content. Enable Jetpack AI to use it again.',
				'jetpack'
			),
		},
		'jetpack/ai-chat': {
			label: __( 'Jetpack AI Search', 'jetpack' ),
			instructions: __(
				'Jetpack AI is disabled so visitors won’t see this block. Enable Jetpack AI to let visitors ask questions about your content.',
				'jetpack'
			),
		},
	}[ name ];

	return (
		<div { ...useBlockProps() }>
			<Placeholder
				label={ label }
				instructions={
					writingAssistantDisabled
						? __(
								'The Writing Assistant is turned off for this site, so this block can’t generate content. Turn the Writing Assistant on in Jetpack AI settings to use it again.',
								'jetpack'
							)
						: instructions
				}
			/>
		</div>
	);
}
