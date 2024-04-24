/**
 * External dependencies
 */
import { useAiSuggestions } from '@automattic/jetpack-ai-client';
import { Button, Spinner } from '@wordpress/components';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
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
	const [ selected, setSelected ] = useState( 'title-0' );
	const [ isTitleOptimizationModalVisible, setIsTitleOptimizationModalVisible ] = useState( false );
	const [ generating, setGenerating ] = useState( false );
	const [ options, setOptions ] = useState( [] );

	const toggleTitleOptimizationModal = useCallback( () => {
		setIsTitleOptimizationModalVisible( ! isTitleOptimizationModalVisible );
	}, [ isTitleOptimizationModalVisible ] );

	const handleDone = useCallback( ( content: string ) => {
		setGenerating( false );
		try {
			const parsedContent = JSON.parse( content );
			setOptions( parsedContent );
		} catch ( e ) {
			// Do nothing
		}
	}, [] );

	const { request } = useAiSuggestions( {
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
				<AiAssistantModal
					handleClose={ toggleTitleOptimizationModal }
					title={ modalTitle }
					maxWidth={ 512 }
				>
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
								options={ options?.map?.( ( option, index ) => ( {
									value: `title-${ index }`,
									label: option.title,
									description: option.explanation,
								} ) ) }
							/>
							<div className="jetpack-ai-title-optimization__cta">
								<Button variant="secondary" onClick={ toggleTitleOptimizationModal }>
									{ __( 'Cancel', 'jetpack' ) }
								</Button>
								<Button variant="primary">{ __( 'Replace title', 'jetpack' ) }</Button>
							</div>
						</>
					) }
				</AiAssistantModal>
			) }
		</div>
	);
}
