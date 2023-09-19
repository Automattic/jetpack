/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps, RichText } from '@wordpress/block-editor';
import { TextControl } from '@wordpress/components';
/**
 * Internal dependencies
 */
import './editor.scss';
import ConnectPrompt from './components/nudge-connect';
import EnableJetpackSearchPrompt from './components/nudge-enable-search';
import { AiChatControls } from './controls';

export default function Edit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();
	return (
		<div { ...blockProps }>
			<ConnectPrompt />
			<EnableJetpackSearchPrompt />
			<div className="jetpack-ai-chat-question-wrapper">
				<TextControl
					className="jetpack-ai-chat-question-input"
					placeholder={ attributes.placeholder }
					size={ 50 }
					disabled={ true }
				/>
				<RichText
					className="wp-block-button__link jetpack-ai-chat-question-button"
					onChange={ value => setAttributes( { askButtonLabel: value } ) }
					value={ attributes.askButtonLabel }
					withoutInteractiveFormatting
					allowedFormats={ [ 'core/bold', 'core/italic', 'core/strikethrough' ] }
				/>
			</div>
			<InspectorControls>
				<AiChatControls
					askButtonLabel={ attributes.askButtonLabel }
					placeholder={ attributes.placeholder }
					setAttributes={ setAttributes }
				/>
			</InspectorControls>
		</div>
	);
}
