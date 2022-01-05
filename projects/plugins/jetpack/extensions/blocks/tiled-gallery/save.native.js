/**
 * Internal dependencies
 */
import Layout from './layout';
import { defaultColumnsNumber } from './edit';
import { getActiveStyleName } from '../../shared/block-styles';
import { LAYOUT_STYLES } from './constants';

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
		roundedCorners,
		columnWidths,
		ids,
	} = attributes;

	const layoutStyle = getActiveStyleName( LAYOUT_STYLES, className );

	return (
		<Layout
			align={ align }
			className={ className }
			columns={ columns }
			images={ images }
			isSave
			layoutStyle={ layoutStyle }
			roundedCorners={ roundedCorners }
			columnWidths={ columnWidths }
			ids={ ids }
		/>
	);
}
