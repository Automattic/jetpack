/**
 * External dependencies
 */
import { aiAssistantIcon, useAiSuggestions } from '@automattic/jetpack-ai-client';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { serialize } from '@wordpress/blocks';
import { Modal, Button, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, close } from '@wordpress/icons';
import TurndownService from 'turndown';
/**
 * Internal dependencies
 */
import {
	delimiter,
	getDelimitedContent,
	getInitialSystemPrompt,
} from '../../../../blocks/ai-assistant/lib/prompt';
import './style.scss';

// Turndown instance
const turndownService = new TurndownService();

const usePostContent = () => {
	const blocks = useSelect( select => select( 'core/editor' ).getBlocks(), [] );
	return blocks?.length ? turndownService.turndown( serialize( blocks ) ) : '';
};

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
	const { tracks } = useAnalytics();

	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId(), [] );
	const postContent = usePostContent();

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
		askQuestionOptions: {
			postId,
		},
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
		messages.push( {
			role: 'user',
			content: `Provide a short feedback about the post content delimited with ${ delimiter }. If it could be improved, provide a list of actions on how to do it. ${ getDelimitedContent(
				postContent
			) }`,
		} );

		request( messages );
		toggleProofreadModal();
		tracks.recordEvent( 'jetpack_ai_get_feedback', {
			post_id: postId,
		} );
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
			<Button onClick={ handleRequest } variant="secondary" disabled={ ! postContent }>
				{ __( 'Generate feedback', 'jetpack' ) }
			</Button>
		</div>
	);
}
