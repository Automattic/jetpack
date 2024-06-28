import { useState } from '@wordpress/element';
import { getExternalLibrary } from '../sources';
import MediaAiButton from './media-ai-button';
import MediaButtonMenu from './media-menu';

const isFeaturedImage = props =>
	props.unstableFeaturedImageFlow ||
	( props.modalClass && props.modalClass.indexOf( 'featured-image' ) !== -1 );
const isReplaceMenu = props => props.multiple === undefined && ! isFeaturedImage( props );

function MediaButton( props ) {
	const { mediaProps } = props;
	const [ selectedSource, setSelectedSource ] = useState( null );
	const ExternalLibrary = getExternalLibrary( selectedSource );
	const isFeatured = isFeaturedImage( mediaProps );

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
			/>
			{ ! isFeatured && <MediaAiButton setSelectedSource={ setSelectedSource } /> }

			{ ExternalLibrary && <ExternalLibrary { ...mediaProps } onClose={ closeLibrary } /> }
		</div>
	);
}

export default MediaButton;
