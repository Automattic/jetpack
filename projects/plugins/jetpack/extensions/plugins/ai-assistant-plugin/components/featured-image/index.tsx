/**
 * External dependencies
 */
import { Button, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import './style.scss';
import { useState } from 'react';
import AiAssistantModal from '../modal';

export default function FeaturedImage() {
	const [ isFeaturedImageModalVisible, setIsFeaturedImageModalVisible ] = useState( false );
	const [ generating, setGenerating ] = useState( false );

	// TODO: Implement post content retrieval and block button click handling
	// const postContent = '';

	// TODO: Implement real generation
	const fakeGeneration = () => {
		setGenerating( true );
		setTimeout( () => {
			setGenerating( false );
		}, 3000 );
	};

	const toggleFeaturedImageModal = () => {
		setIsFeaturedImageModalVisible( ! isFeaturedImageModalVisible );
	};

	const handleRequest = () => {
		toggleFeaturedImageModal();
		//TODO: Implement image generation
		fakeGeneration();
	};

	return (
		<div>
			<p>
				{ __(
					'Ask Jetpack AI to generate an image based on your post content, to use as the post featured image.',
					'jetpack'
				) }
			</p>
			<Button onClick={ handleRequest } variant="secondary">
				{ __( 'Generate image', 'jetpack' ) }
			</Button>
			{ isFeaturedImageModalVisible && (
				<AiAssistantModal handleClose={ toggleFeaturedImageModal }>
					{ generating ? (
						<div className="ai-assistant-featured-image__loading">
							<Spinner
								style={ {
									width: '50px',
									height: '50px',
								} }
							/>
						</div>
					) : (
						<div className="ai-assistant-featured-image__content">
							<img
								className="ai-assistant-featured-image__image"
								src="https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg"
								alt={ __( 'Beatiful landscape', 'jetpack' ) }
							/>
							<div className="ai-assistant-featured-image__actions">
								<Button onClick={ toggleFeaturedImageModal } variant="secondary">
									{ __( 'Accept image', 'jetpack' ) }
								</Button>
								<Button onClick={ fakeGeneration } variant="secondary">
									{ __( 'Generate another image', 'jetpack' ) }
								</Button>
							</div>
						</div>
					) }
				</AiAssistantModal>
			) }
		</div>
	);
}
