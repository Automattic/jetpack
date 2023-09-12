import { InspectorAdvancedControls, InspectorControls } from '@wordpress/block-editor';
import { BaseControl, PanelBody, TextControl, TextareaControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

export function AiChatControls( { setAttributes, askButtonLabel } ) {
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
						label={ __( 'Ask button', 'jetpack' ) }
						help={ __( 'What do you want the button to say?', 'jetpack' ) }
						className="jetpack-ai-chat__ask-button-text"
					>
						<TextControl
							placeholder={ __( 'Ask', 'jetpack' ) }
							onChange={ newAskButtonLabel =>
								setAttributes( { askButtonLabel: newAskButtonLabel } )
							}
							value={ askButtonLabel }
						/>
					</BaseControl>
				</PanelBody>
			</InspectorControls>
			<InspectorAdvancedControls>
				<BaseControl
					label={ __( 'Prompt override', 'jetpack' ) }
					help={ __(
						'This will override the default prompt used in Jetpack AI Search. Relevant documents from your blog and the user question is passed to Jetpack AI to produce an answer. You can change the tone and behaviour of Jetpack AI Search by tweaking this prompt, but it requires caution and may result in unwanted behaviour.',
						'jetpack'
					) }
					value={ promptOverride }
					onChange={ setPromptOverride }
				>
					<TextareaControl
						placeholder={ __(
							'Based on the content and relevant URLs provided below, all from a blog written by the same author, answer the following question…',
							'jetpack'
						) }
					/>
				</BaseControl>
			</InspectorAdvancedControls>
		</>
	);
}
