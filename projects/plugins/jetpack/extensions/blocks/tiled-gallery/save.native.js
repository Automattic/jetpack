/**
 * Internal dependencies
 */
import Layout from './layout';
import { defaultColumnsNumber } from './edit';

export default function TiledGallerySave( { attributes, innerBlocks } ) {
	if ( ! attributes.images.length && ! innerBlocks.length ) {
		return null;
	}

	const imageData = innerBlocks.length ? innerBlocks : attributes.images;
	const images = imageData.map( image => {
		if ( image.attributes ) {
			return {
				...image.attributes,
				width: 100,
				height: 100,
			};
		}
		return image;
	} );

	const {
		align,
		className,
		columns = defaultColumnsNumber( images ),
		linkTo,
		roundedCorners,
		columnWidths,
		ids,
	} = attributes;

	return (
		<Layout
			align={ align }
			className={ className }
			columns={ columns }
			images={ images }
			isSave
			layoutStyle={ 'square' }
			linkTo={ linkTo }
			roundedCorners={ roundedCorners }
			columnWidths={ columnWidths }
			ids={ ids }
		/>
	);
}
