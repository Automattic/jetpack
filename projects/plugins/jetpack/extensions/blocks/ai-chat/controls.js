import { InspectorAdvancedControls, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl, TextareaControl, ToggleControl } from '@wordpress/components';
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
					<TextControl
						label={ __( 'Placeholder Text', 'jetpack' ) }
						className="jetpack-ai-chat__ask-button-text"
						placeholder={ DEFAULT_PLACEHOLDER }
						onChange={ newPlaceholder => setAttributes( { placeholder: newPlaceholder } ) }
						value={ placeholder }
						__nextHasNoMarginBottom={ true }
						__next40pxDefaultSize={ true }
					/>
				</PanelBody>
			</InspectorControls>
			<InspectorAdvancedControls>
				<TextareaControl
					label={ __( 'Additional instructions', 'jetpack' ) }
					help={ __(
						'Give Jetpack AI additional instructions for answer length, format, and tone.',
						'jetpack'
					) }
					value={ promptOverride }
					onChange={ setPromptOverride }
					__nextHasNoMarginBottom={ true }
				/>
				<ToggleControl
					label={ __( 'Show copy answer button.', 'jetpack' ) }
					help={ __( 'Allow users to easily copy the answer.', 'jetpack' ) }
					checked={ showCopy }
					onChange={ newCopy => setAttributes( { showCopy: newCopy } ) }
					__nextHasNoMarginBottom={ true }
				/>
				<ToggleControl
					label={ __( 'Show rating button.', 'jetpack' ) }
					help={ __( 'Allow users to rate the answer and give feedback.', 'jetpack' ) }
					checked={ showFeedback }
					onChange={ newFeedback => setAttributes( { showFeedback: newFeedback } ) }
					__nextHasNoMarginBottom={ true }
				/>
				<ToggleControl
					label={ __( 'Show list of sources.', 'jetpack' ) }
					help={ __( 'Show used sources at the bottom of the answer.', 'jetpack' ) }
					checked={ showSources }
					onChange={ newSources => setAttributes( { showSources: newSources } ) }
					__nextHasNoMarginBottom={ true }
				/>
			</InspectorAdvancedControls>
		</>
	);
}
