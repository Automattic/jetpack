/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getExternalLibrary } from '../sources';
import MediaButtonMenu from './media-menu';

const isFeaturedImage = props =>
	props.unstableFeaturedImageFlow ||
	( props.modalClass && props.modalClass.indexOf( 'featured-image' ) !== -1 );
const isReplaceMenu = props => props.multiple === undefined && ! isFeaturedImage( props );

function MediaButton( props ) {
	const { mediaProps } = props;
	const [ selectedSource, setSelectedSource ] = useState( null );
	const ExternalLibrary = getExternalLibrary( selectedSource );

	const closeLibrary = ev => {
		if ( ev ) {
			ev.stopPropagation();

			// The DateTime picker is triggering a modal close when selected. We don't want this to close the modal
			if ( ev.target.closest( '.a8c-media-header__dropdown' ) ) {
				return;
			}
		}

		setSelectedSource( null );
	};

	return (
		<>
			<MediaButtonMenu
				{ ...props }
				setSelectedSource={ setSelectedSource }
				isReplace={ isReplaceMenu( mediaProps ) }
				isFeatured={ isFeaturedImage( mediaProps ) }
			/>

			{ ExternalLibrary && <ExternalLibrary onClose={ closeLibrary } { ...mediaProps } /> }
		</>
	);
}

export default MediaButton;
