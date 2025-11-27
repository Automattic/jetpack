import { MenuItem } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import {
	internalMediaSources,
	externalMediaSources,
	featuredImageExclusiveMediaSources,
	generalPurposeImageExclusiveMediaSources,
} from '../sources';
import { isFeaturedImageGeneratorEnabled } from '../utils/is-featured-image-generator-enabled';
import { isGeneralPurposeImageGeneratorBetaEnabled } from '../utils/is-general-purpose-image-generator-beta-enabled';

/**
 * MediaSources component
 * @param {object}   props                - The component properties.
 * @param {Function} props.originalButton - The function to render original button.
 * @param {Function} props.onClick        - To handle the click event.
 * @param {Function} props.open           - To handle the open.
 * @param {Function} props.setSource      - To set the source.
 * @param {boolean}  props.isFeatured     - Whether it's featured.
 * @param {object}   props.mediaProps     - The original button properties.
 * @return {import('react').ReactElement} The `MediaSources` component.
 */
function MediaSources( {
	originalButton = null,
	onClick = () => {},
	open,
	setSource,
	isFeatured = false,
	mediaProps = {},
} ) {
	const extraMediaSources = applyFilters( 'jetpack.externalMedia.extraMediaSources', [], {
		onClick,
		isFeatured,
		allowedTypes: mediaProps.allowedTypes,
		multiple: mediaProps.multiple,
		onSelect: mediaProps.onSelect,
	} );

	const renderMenuItem = ( { id, icon, label, onClick: customOnClick } ) => {
		return (
			<MenuItem
				icon={ icon }
				key={ id }
				onClick={
					customOnClick ||
					( () => {
						onClick();
						setSource( id );
					} )
				}
			>
				{ label }
			</MenuItem>
		);
	};

	return (
		<Fragment>
			{ originalButton && originalButton( { open } ) }
			{ internalMediaSources.map( renderMenuItem ) }

			{ isFeatured &&
				isFeaturedImageGeneratorEnabled() &&
				featuredImageExclusiveMediaSources.map( renderMenuItem ) }

			{ ! isFeatured &&
				isGeneralPurposeImageGeneratorBetaEnabled() &&
				generalPurposeImageExclusiveMediaSources.map( renderMenuItem ) }

			{ extraMediaSources.map( renderMenuItem ) }

			<hr style={ { marginLeft: '-8px', marginRight: '-8px' } } />

			{ externalMediaSources.map( renderMenuItem ) }
		</Fragment>
	);
}

export default MediaSources;
