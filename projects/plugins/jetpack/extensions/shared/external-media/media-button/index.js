import { useBlockEditContext } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import { getExternalLibrary } from '../sources';
import MediaAiButton from './media-ai-button';
import MediaButtonMenu from './media-menu';

const isFeaturedImage = props =>
	props.unstableFeaturedImageFlow ||
	( props.modalClass && props.modalClass.indexOf( 'featured-image' ) !== -1 );
const isReplaceMenu = props => props.multiple === undefined && ! isFeaturedImage( props );

const blocksWithAiButtonSupport = [ 'core/image', 'core/gallery', 'jetpack/slideshow' ];

/**
 * Temporary feature flag to control generalPurposeImageExclusiveMediaSources
 * visibility.
 */
const GENERAL_PURPOSE_IMAGE_GENERATOR_BETA_FLAG = 'ai-general-purpose-image-generator';
const isGeneralPurposeImageGeneratorBetaEnabled =
	window?.Jetpack_Editor_Initial_State?.available_blocks?.[
		GENERAL_PURPOSE_IMAGE_GENERATOR_BETA_FLAG
	]?.available === true;

// to-do: remove when Jetpack requires WordPress 6.7.
const hasLargeButtons = window?.Jetpack_Editor_Initial_State?.next40pxDefaultSize;

function MediaButton( props ) {
	const { name } = useBlockEditContext();
	const { mediaProps } = props;
	const [ selectedSource, setSelectedSource ] = useState( null );
	const ExternalLibrary = getExternalLibrary( selectedSource );
	const isFeatured = isFeaturedImage( mediaProps );
	const hasAiButtonSupport = blocksWithAiButtonSupport.includes( name );

	const closeLibrary = event => {
		if ( event ) {
			event.stopPropagation();

			// The DateTime picker is triggering a modal close when selected. We don't want this to close the modal
			if ( event.target.closest( '.jetpack-external-media-header__dropdown' ) ) {
				return;
			}
		}

		setSelectedSource( null );
		mediaProps.onClose?.();
	};

	return (
		// No added functionality, just capping event propagation.
		// eslint-disable-next-line  jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
		<div
			onClick={ event => event.stopPropagation() }
			className="jetpack-external-media-button-wrapper"
		>
			<MediaButtonMenu
				{ ...props }
				setSelectedSource={ setSelectedSource }
				isReplace={ isReplaceMenu( mediaProps ) }
				isFeatured={ isFeatured }
				hasImage={ mediaProps.value > 0 }
				hasLargeButtons={ hasLargeButtons }
			/>
			{ isGeneralPurposeImageGeneratorBetaEnabled && ! isFeatured && hasAiButtonSupport && (
				<MediaAiButton
					setSelectedSource={ setSelectedSource }
					hasLargeButtons={ hasLargeButtons }
				/>
			) }

			{ ExternalLibrary && <ExternalLibrary { ...mediaProps } onClose={ closeLibrary } /> }
		</div>
	);
}

export default MediaButton;
