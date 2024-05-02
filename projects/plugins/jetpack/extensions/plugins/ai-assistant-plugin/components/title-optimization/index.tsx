/**
 * External dependencies
 */
import { useAiSuggestions } from '@automattic/jetpack-ai-client';
import { Button, Spinner } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import useAutoSaveAndRedirect from '../../../../shared/use-autosave-and-redirect';
import usePostContent from '../../hooks/use-post-content';
import AiAssistantModal from '../modal';
import TitleOptimizationOptions from './title-optimization-options';
import './style.scss';

export default function TitleOptimization( {
	busy,
	disabled,
}: {
	busy: boolean;
	disabled: boolean;
} ) {
	const modalTitle = __( 'Optimize post title', 'jetpack' );

	const postContent = usePostContent();
	const [ selected, setSelected ] = useState( null );
	const [ isTitleOptimizationModalVisible, setIsTitleOptimizationModalVisible ] = useState( false );
	const [ generating, setGenerating ] = useState( false );
	const [ options, setOptions ] = useState( [] );
	const { editPost } = useDispatch( 'core/editor' );
	const { autosave } = useAutoSaveAndRedirect();
	const { increaseAiAssistantRequestsCount } = useDispatch( 'wordpress-com/plans' );

	const toggleTitleOptimizationModal = useCallback( () => {
		setIsTitleOptimizationModalVisible( ! isTitleOptimizationModalVisible );
	}, [ isTitleOptimizationModalVisible ] );

	const handleDone = useCallback(
		( content: string ) => {
			setGenerating( false );
			increaseAiAssistantRequestsCount();

			try {
				const parsedContent = JSON.parse( content );
				setOptions( parsedContent );
				setSelected( parsedContent?.[ 0 ]?.title );
			} catch ( e ) {
				// Do nothing
			}
		},
		[ increaseAiAssistantRequestsCount ]
	);

	const { request, stopSuggestion } = useAiSuggestions( {
		onDone: handleDone,
		onError: () => {
			setGenerating( false );
		},
	} );

	const handleRequest = useCallback( () => {
		// Message to request a backend prompt for this feature
		const messages = [
			{
				role: 'jetpack-ai' as const,
				context: {
					type: 'title-optimization',
					content: postContent,
				},
			},
		];

		request( messages, { feature: 'jetpack-ai-title-optimization' } );
	}, [ postContent, request ] );

	const handleTitleOptimization = useCallback( () => {
		setGenerating( true );
		toggleTitleOptimizationModal();
		handleRequest();
	}, [ handleRequest, toggleTitleOptimizationModal ] );

	const handleAccept = useCallback(
		( event: MouseEvent ) => {
			editPost( { title: selected } );
			toggleTitleOptimizationModal();

			try {
				autosave( event );
			} catch ( e ) {
				// Do nothing since the user can save manually
			}
		},
		[ autosave, editPost, selected, toggleTitleOptimizationModal ]
	);

	const handleClose = useCallback( () => {
		toggleTitleOptimizationModal();
		stopSuggestion();
	}, [ stopSuggestion, toggleTitleOptimizationModal ] );

	return (
		<div>
			<p>{ __( 'Use AI to optimize key details of your post.', 'jetpack' ) }</p>
			<Button
				isBusy={ busy }
				disabled={ disabled }
				onClick={ handleTitleOptimization }
				variant="secondary"
			>
				{ __( 'Improve title', 'jetpack' ) }
			</Button>
			{ isTitleOptimizationModalVisible && (
				<AiAssistantModal handleClose={ handleClose } title={ modalTitle } maxWidth={ 512 }>
					{ generating ? (
						<div className="jetpack-ai-title-optimization__loading">
							<Spinner
								style={ {
									width: '50px',
									height: '50px',
								} }
							/>
							{ __( 'Reading your post and generating suggestions…', 'jetpack' ) }
						</div>
					) : (
						<>
							<span className="jetpack-ai-title-optimization__intro">
								{ __( 'Choose an optimized title below:', 'jetpack' ) }
							</span>
							<TitleOptimizationOptions
								onChangeValue={ e => setSelected( e.target.value ) }
								selected={ selected }
								options={ options?.map?.( option => ( {
									value: option.title,
									label: option.title,
									description: option.explanation,
								} ) ) }
							/>
							<div className="jetpack-ai-title-optimization__cta">
								<Button variant="secondary" onClick={ toggleTitleOptimizationModal }>
									{ __( 'Cancel', 'jetpack' ) }
								</Button>
								<Button variant="primary" onClick={ handleAccept }>
									{ __( 'Replace title', 'jetpack' ) }
								</Button>
							</div>
						</>
					) }
				</AiAssistantModal>
			) }
		</div>
	);
}
