/**
 * External dependencies
 */
import { useAiSuggestions } from '@automattic/jetpack-ai-client';
import { Modal, Button, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, close } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import aiAssistantIcon from '../../../../blocks/ai-assistant/icons/ai-assistant';
import {
	delimiter,
	getDelimitedContent,
	getInitialSystemPrompt,
} from '../../../../blocks/ai-assistant/lib/prompt';
import { getContentFromBlocks } from '../../../../blocks/ai-assistant/lib/utils/block-content';
import './style.scss';

const ModalHeader = ( { loading, onClose } ) => {
	return (
		<div className="ai-assistant-post-feedback__modal-header">
			<div className="ai-assistant-post-feedback__modal-title-wrapper">
				{ loading ? <Spinner /> : <Icon icon={ aiAssistantIcon } /> }
				<h1 className="ai-assistant-post-feedback__modal-title">
					{ __( 'AI Assistant', 'jetpack' ) }
				</h1>
			</div>
			<Button icon={ close } label={ __( 'Close', 'jetpack' ) } onClick={ onClose } />
		</div>
	);
};

export default function Proofread() {
	const [ isProofreadModalVisible, setIsProofreadModalVisible ] = useState( false );
	const [ suggestion, setSuggestion ] = useState( null );
	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId(), [] );

	const toggleProofreadModal = () => {
		setIsProofreadModalVisible( ! isProofreadModalVisible );
	};

	const handleSuggestion = ( content: string ) => {
		const text = content.split( '\n' ).map( ( line, idx ) => {
			return line?.length ? <p key={ `line-${ idx }` }>{ line }</p> : null;
		} );

		setSuggestion( text );
	};

	const handleSuggestionError = () => {
		/// TODO: Handle Error
	};

	const handleDone = () => {
		// TODO: Handle Done
	};

	const { request, requestingState } = useAiSuggestions( {
		postId,
		onSuggestion: handleSuggestion,
		onDone: handleDone,
		onError: handleSuggestionError,
	} );

	const handleRequest = () => {
		const messages = [
			getInitialSystemPrompt( {
				context:
					'You are an advanced polyglot ghostwriter. Your task is to review blog content, and provide reasonable actions and feedback about the content, without suggesting to rewrite or help with. This functionality is integrated into the Jetpack product developed by Automattic. Users interact with you through a Gutenberg sidebar, you are inside the WordPress editor',
				rules: [
					'Format your response in plain text only including break lines.',
					'Focus on feeeback and not summarize the content.',
					"Be concise and direct, doesn't repeat the content, and avoid repeat the request. Ex. 'The content delimited ...'",
					'Do not ask to assist with something more',
					'Answer in the same language as the content',
				],
				useGutenbergSyntax: false,
				useMarkdown: false,
			} ),
		];
		const postContent = getContentFromBlocks();
		messages.push( {
			role: 'user',
			content: `Provide a short feedback about the post content delimited with ${ delimiter }. If it could be improved, provide a list of actions on how to do it. ${ getDelimitedContent(
				postContent
			) }`,
		} );

		request( messages );
		toggleProofreadModal();
	};

	return (
		<div>
			{ isProofreadModalVisible && (
				<Modal __experimentalHideHeader>
					<div className="ai-assistant-post-feedback__modal-content">
						<ModalHeader
							loading={ requestingState === 'suggesting' || requestingState === 'requesting' }
							onClose={ toggleProofreadModal }
						/>
						<hr className="ai-assistant-post-feedback__modal-divider" />
						<div className="ai-assistant-post-feedback__suggestion">{ suggestion }</div>
					</div>
				</Modal>
			) }
			<p>
				{ __(
					'Check for mistakes and verify the tone of your post before publishing.',
					'jetpack'
				) }
			</p>
			<Button onClick={ handleRequest } variant="secondary">
				{ __( 'Generate feedback', 'jetpack' ) }
			</Button>
		</div>
	);
}
