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
import { AiChatControls } from './controls';

export default function Edit( { attributes, setAttributes, clientId } ) {
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
					placeholder={ attributes.placeholder }
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
			{ isBlockSelected && <GuidelineMessage /> }
			<InspectorControls>
				<AiChatControls
					askButtonLabel={ attributes.askButtonLabel }
					placeholder={ attributes.placeholder }
					setAttributes={ setAttributes }
					showCopy={ attributes.showCopy }
					showFeedback={ attributes.showFeedback }
					showSources={ attributes.showSources }
				/>
			</InspectorControls>
		</div>
	);
}
