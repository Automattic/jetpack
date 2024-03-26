/**
 * External dependencies
 */
import { AiStatusIndicator, useAiSuggestions } from '@automattic/jetpack-ai-client';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { serialize } from '@wordpress/blocks';
import { Modal, Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import TurndownService from 'turndown';
/**
 * Internal dependencies
 */
import './style.scss';
/**
 * Types
 */
import type * as BlockEditorSelectors from '@wordpress/block-editor/store/selectors';
import type * as EditorSelectors from '@wordpress/editor/store/selectors';

// Turndown instance
const turndownService = new TurndownService();

const usePostContent = () => {
	const blocks = useSelect(
		select => ( select( 'core/block-editor' ) as typeof BlockEditorSelectors ).getBlocks(),
		[]
	);
	return blocks?.length ? turndownService.turndown( serialize( blocks ) ) : '';
};

const ModalHeader = ( { requestingState, onClose } ) => {
	return (
		<div className="ai-assistant-post-feedback__modal-header">
			<div className="ai-assistant-post-feedback__modal-title-wrapper">
				<AiStatusIndicator state={ requestingState } />
				<h1 className="ai-assistant-post-feedback__modal-title">
					{ __( 'AI Assistant', 'jetpack' ) }
				</h1>
			</div>
			<Button icon={ close } label={ __( 'Close', 'jetpack' ) } onClick={ onClose } />
		</div>
	);
};

export default function Proofread( {
	disabled = false,
	busy = false,
}: {
	disabled?: boolean;
	busy?: boolean;
} ) {
	const [ isProofreadModalVisible, setIsProofreadModalVisible ] = useState( false );
	const [ suggestion, setSuggestion ] = useState( null );
	const { tracks } = useAnalytics();

	const postId = useSelect(
		select => ( select( 'core/editor' ) as typeof EditorSelectors ).getCurrentPostId(),
		[]
	);
	const postContent = usePostContent();

	const toggleProofreadModal = () => {
		setIsProofreadModalVisible( ! isProofreadModalVisible );
	};

	const { increaseAiAssistantRequestsCount, dequeueAiAssistantFeatureAsyncRequest } =
		useDispatch( 'wordpress-com/plans' );

	const handleSuggestion = ( content: string ) => {
		const text = content.split( '\n' ).map( ( line, idx ) => {
			return line?.length ? <p key={ `line-${ idx }` }>{ line }</p> : null;
		} );

		setSuggestion( text );
	};

	const handleSuggestionError = () => {
		/// TODO: Handle Error
	};

	const handleDone = useCallback( () => {
		increaseAiAssistantRequestsCount();
	}, [ increaseAiAssistantRequestsCount ] );

	const { request, requestingState } = useAiSuggestions( {
		askQuestionOptions: {
			postId,
		},
		onSuggestion: handleSuggestion,
		onDone: handleDone,
		onError: handleSuggestionError,
	} );

	const handleRequest = () => {
		// Message to request a backend prompt for this feature
		const messages = [
			{
				role: 'jetpack-ai' as const,
				context: {
					type: 'proofread-plugin',
					content: postContent,
				},
			},
		];

		/*
		 * Always dequeue/cancel the AI Assistant feature async request,
		 * in case there is one pending,
		 * when performing a new AI suggestion request.
		 */
		dequeueAiAssistantFeatureAsyncRequest();

		request( messages, { feature: 'jetpack-ai-proofread-plugin' } );
		toggleProofreadModal();
		tracks.recordEvent( 'jetpack_ai_get_feedback', {
			feature: 'jetpack-ai-proofread-plugin',
		} );
	};

	return (
		<div>
			{ isProofreadModalVisible && (
				<Modal __experimentalHideHeader>
					<div className="ai-assistant-post-feedback__modal-content">
						<ModalHeader requestingState={ requestingState } onClose={ toggleProofreadModal } />
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
			<Button
				onClick={ handleRequest }
				variant="secondary"
				disabled={ ! postContent || disabled }
				isBusy={ busy }
			>
				{ __( 'Generate feedback', 'jetpack' ) }
			</Button>
		</div>
	);
}
