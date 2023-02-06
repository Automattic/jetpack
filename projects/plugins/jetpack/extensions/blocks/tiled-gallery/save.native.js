import { getActiveStyleName } from '../../shared/block-styles';
import { LAYOUT_STYLES } from './constants';
import { defaultColumnsNumber } from './edit';
import Layout from './layout';

export default function TiledGallerySave( { attributes, innerBlocks } ) {
	if ( ! attributes.images.length && ! innerBlocks.length ) {
		return null;
	}

	const imageData = innerBlocks.length ? innerBlocks : attributes.images;
	const images = imageData.map( image => {
		if ( image.attributes ) {
			return {
				...image.attributes,
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
