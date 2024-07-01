/**
 * External dependencies
 */
import { GuidelineMessage } from '@automattic/jetpack-ai-client';
/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps, RichText } from '@wordpress/block-editor';
import { TextControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import './editor.scss';
import ConnectPrompt from './components/nudge-connect';
import EnableJetpackSearchPrompt from './components/nudge-enable-search';
import { DEFAULT_ASK_BUTTON_LABEL, DEFAULT_PLACEHOLDER } from './constants';
import { AiChatControls } from './controls';

export default function Edit( { attributes, setAttributes, clientId } ) {
	const {
		askButtonLabel = DEFAULT_ASK_BUTTON_LABEL,
		placeholder = DEFAULT_PLACEHOLDER,
		showCopy,
		showFeedback,
		showSources,
	} = attributes;
	const blockProps = useBlockProps();
	const isBlockSelected = useSelect(
		select => {
			return select( 'core/block-editor' ).isBlockSelected( clientId );
		},
		[ clientId ]
	);
	return (
		<div { ...blockProps }>
			<ConnectPrompt />
			<EnableJetpackSearchPrompt />
			<div className="jetpack-ai-chat-question-wrapper">
				<TextControl
					className="jetpack-ai-chat-question-input"
					placeholder={ placeholder }
					disabled={ true }
				/>
				<RichText
					className="wp-block-button__link jetpack-ai-chat-question-button"
					onChange={ value => setAttributes( { askButtonLabel: value } ) }
					value={ askButtonLabel }
					withoutInteractiveFormatting
					allowedFormats={ [ 'core/bold', 'core/italic', 'core/strikethrough' ] }
				/>
			</div>
			{ isBlockSelected && <GuidelineMessage /> }
			<InspectorControls>
				<AiChatControls
					askButtonLabel={ askButtonLabel }
					placeholder={ placeholder }
					setAttributes={ setAttributes }
					showCopy={ showCopy }
					showFeedback={ showFeedback }
					showSources={ showSources }
				/>
			</InspectorControls>
		</div>
	);
}
