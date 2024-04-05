import { InspectorAdvancedControls, InspectorControls } from '@wordpress/block-editor';
import {
	BaseControl,
	PanelBody,
	TextControl,
	TextareaControl,
	ToggleControl,
} from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { DEFAULT_PLACEHOLDER } from './constants';

export function AiChatControls( {
	setAttributes,
	placeholder,
	showCopy,
	showFeedback,
	showSources,
} ) {
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
							placeholder={ DEFAULT_PLACEHOLDER }
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
				<ToggleControl
					label={ __( 'Show copy answer button.', 'jetpack' ) }
					help={ __( 'Allow users to easily copy the answer.', 'jetpack' ) }
					checked={ showCopy }
					onChange={ newCopy => setAttributes( { showCopy: newCopy } ) }
				/>
				<ToggleControl
					label={ __( 'Show rating button.', 'jetpack' ) }
					help={ __( 'Allow users to rate the answer and give feedback.', 'jetpack' ) }
					checked={ showFeedback }
					onChange={ newFeedback => setAttributes( { showFeedback: newFeedback } ) }
				/>
				<ToggleControl
					label={ __( 'Show list of sources.', 'jetpack' ) }
					help={ __( 'Show used sources at the bottom of the answer.', 'jetpack' ) }
					checked={ showSources }
					onChange={ newSources => setAttributes( { showSources: newSources } ) }
				/>
			</InspectorAdvancedControls>
		</>
	);
}
