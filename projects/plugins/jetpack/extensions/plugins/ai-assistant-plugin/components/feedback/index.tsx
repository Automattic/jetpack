import {
	useAiSuggestions,
	usePostContent,
	AiAssistantModal,
	renderHTMLFromMarkdown,
} from '@automattic/jetpack-ai-client';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { RawHTML, useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import './style.scss';

export default function Feedback( {
	disabled = false,
	busy = false,
	placement,
}: {
	placement: string;
	disabled?: boolean;
	busy?: boolean;
} ) {
	const [ isFeedbackModalVisible, setIsFeedbackModalVisible ] = useState( false );
	const [ suggestion, setSuggestion ] = useState< string >( '' );
	const { tracks } = useAnalytics();

	const postId = useSelect( select => select( editorStore ).getCurrentPostId(), [] );
	const { getPostContent, isEditedPostEmpty } = usePostContent();

	const toggleFeedbackModal = () => {
		setIsFeedbackModalVisible( ! isFeedbackModalVisible );
	};

	const { increaseAiAssistantRequestsCount, dequeueAiAssistantFeatureAsyncRequest } =
		useDispatch( 'wordpress-com/plans' );

	const handleSuggestion = ( content: string ) => {
		const html = renderHTMLFromMarkdown( { content } );
		setSuggestion( html );
	};

	const handleSuggestionError = () => {
		/// TODO: Handle Error
	};

	const handleDone = useCallback( () => {
		increaseAiAssistantRequestsCount();
	}, [ increaseAiAssistantRequestsCount ] );

	const { request, requestingState } = useAiSuggestions( {
		askQuestionOptions: {
			postId: Number( postId ),
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
					type: 'proofread-plugin', // Legacy name, do not change
					content: getPostContent(),
				},
			},
		];

		/*
		 * Always dequeue/cancel the AI Assistant feature async request,
		 * in case there is one pending,
		 * when performing a new AI suggestion request.
		 */
		dequeueAiAssistantFeatureAsyncRequest();

		request( messages, { feature: 'jetpack-ai-proofread-plugin' } ); // Legacy name, do not change
		toggleFeedbackModal();
		tracks.recordEvent( 'jetpack_ai_get_feedback', {
			feature: 'jetpack-ai-proofread-plugin', // Legacy name, do not change
			placement,
		} );
	};

	return (
		<div>
			{ isFeedbackModalVisible && (
				<AiAssistantModal requestingState={ requestingState } handleClose={ toggleFeedbackModal }>
					<RawHTML className="ai-assistant-post-feedback__suggestion">{ suggestion }</RawHTML>
				</AiAssistantModal>
			) }
			<p className="jetpack-ai-assistant__help-text">
				{ __( 'Get feedback on content structure.', 'jetpack' ) }
			</p>
			<Button
				onClick={ handleRequest }
				variant="secondary"
				disabled={ isEditedPostEmpty() || disabled }
				isBusy={ busy }
				__next40pxDefaultSize
			>
				{ __( 'Generate feedback', 'jetpack' ) }
			</Button>
		</div>
	);
}
