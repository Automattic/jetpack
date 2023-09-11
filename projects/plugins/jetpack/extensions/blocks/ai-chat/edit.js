/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import './editor.scss';
import { AiChatControls } from './controls';
import QuestionAnswer from './question-answer';

export default function Edit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();
	return (
		<div { ...blockProps }>
			<QuestionAnswer askButtonLabel={ attributes.askButtonLabel } />
			<InspectorControls>
				<AiChatControls
					askButtonLabel={ attributes.askButtonLabel }
					setAttributes={ setAttributes }
				/>
			</InspectorControls>
		</div>
	);
}
