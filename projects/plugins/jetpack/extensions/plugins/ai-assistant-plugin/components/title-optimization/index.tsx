/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import AiAssistantModal from '../modal';

export default function TitleOptimization( {
	busy,
	disabled,
}: {
	busy: boolean;
	disabled: boolean;
} ) {
	const modalTitle = __( 'Optimize post title', 'jetpack' );
	const [ isTitleOptimizationModalVisible, setIsTitleOptimizationModalVisible ] = useState( false );

	const toggleTitleOptimizationModal = useCallback( () => {
		setIsTitleOptimizationModalVisible( ! isTitleOptimizationModalVisible );
	}, [ isTitleOptimizationModalVisible ] );

	return (
		<div>
			<p>{ __( 'Use AI to optimize key details of your post.', 'jetpack' ) }</p>
			<Button
				isBusy={ busy }
				disabled={ disabled }
				onClick={ toggleTitleOptimizationModal }
				variant="secondary"
			>
				{ __( 'Improve title', 'jetpack' ) }
			</Button>
			{ isTitleOptimizationModalVisible && (
				<AiAssistantModal handleClose={ toggleTitleOptimizationModal } title={ modalTitle }>
					<p>{ __( 'This is the modal content.', 'jetpack' ) }</p>
				</AiAssistantModal>
			) }
		</div>
	);
}
