/**
 * External dependencies
 */
import { useAiSuggestions } from '@automattic/jetpack-ai-client';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import './style.scss';
import usePostContent from '../../hooks/use-post-content';
import AiAssistantModal from '../modal';
/**
 * Types
 */
import type * as EditorSelectors from '@wordpress/editor/store/selectors';

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
				<AiAssistantModal requestingState={ requestingState } handleClose={ toggleProofreadModal }>
					<div className="ai-assistant-post-feedback__suggestion">{ suggestion }</div>
				</AiAssistantModal>
			) }
			<p>
				{ __(
					'Get suggestions on how to enhance your post to better engage your audience.',
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
