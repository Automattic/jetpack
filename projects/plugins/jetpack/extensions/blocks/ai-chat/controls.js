import { InspectorAdvancedControls, InspectorControls } from '@wordpress/block-editor';
import { BaseControl, PanelBody, TextControl, TextareaControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

export function AiChatControls( { setAttributes, placeholder } ) {
	const [ promptOverride, setPromptOverride ] = useEntityProp(
		'root',
		'site',
		'jetpack_search_ai_prompt_override'
	);
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack' ) } initialOpen={ false }>
					<BaseControl
						label={ __( 'Placeholder Text', 'jetpack' ) }
						className="jetpack-ai-chat__ask-button-text"
					>
						<TextControl
							placeholder={ __( 'Ask a question about this site.', 'jetpack' ) }
							onChange={ newPlaceholder => setAttributes( { placeholder: newPlaceholder } ) }
							value={ placeholder }
						/>
					</BaseControl>
				</PanelBody>
			</InspectorControls>
			<InspectorAdvancedControls>
				<BaseControl
					label={ __( 'Additional instructions', 'jetpack' ) }
					help={ __(
						'Give Jetpack AI additional instructions for answer length, format, and tone.',
						'jetpack'
					) }
				>
					<TextareaControl value={ promptOverride } onChange={ setPromptOverride } />
				</BaseControl>
			</InspectorAdvancedControls>
		</>
	);
}
