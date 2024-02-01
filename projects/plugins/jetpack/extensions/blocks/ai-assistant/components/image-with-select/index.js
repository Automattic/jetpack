/*
 * External dependencies
 */
import { Button, Flex, FlexBlock, FlexItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const ImageWithSelect = ( { image, inModal = false, saveImage, setImageModal } ) => {
	return (
		<Flex direction="column">
			{ inModal && (
				<FlexItem style={ { textAlign: 'center' } }>
					<Button variant="primary" onClick={ () => saveImage( image ) }>
						{ __( 'Use this image', 'jetpack' ) }
					</Button>
				</FlexItem>
			) }
			<FlexBlock>
				<input
					type="image"
					className="wp-block-ai-image-image"
					src={ image }
					alt=""
					onClick={ () => setImageModal( image ) }
				/>
			</FlexBlock>
			{ ! inModal && (
				<FlexBlock>
					<Flex direction="column" style={ { alignItems: 'center' } }>
						<FlexItem>
							<Button variant="primary" onClick={ () => saveImage( image ) }>
								{ __( 'Use this image', 'jetpack' ) }
							</Button>
						</FlexItem>
					</Flex>
				</FlexBlock>
			) }
		</Flex>
	);
};

export default ImageWithSelect;
