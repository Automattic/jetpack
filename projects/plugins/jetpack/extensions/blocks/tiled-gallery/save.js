import { getActiveStyleName } from '../../shared/block-styles';
import { LAYOUT_STYLES } from './constants';
import { defaultColumnsNumber } from './edit';
import Layout from './layout';

export default function TiledGallerySave( { attributes } ) {
	const { imageFilter, images } = attributes;

	if ( ! images.length ) {
		return null;
	}

	const {
		align,
		className,
		columns = defaultColumnsNumber( attributes ),
		linkTo,
		roundedCorners,
		columnWidths,
	} = attributes;

	return (
		<Layout
			align={ align }
			className={ className }
			columns={ columns }
			imageFilter={ imageFilter }
			images={ images }
			isSave
			layoutStyle={ getActiveStyleName( LAYOUT_STYLES, className ) }
			linkTo={ linkTo }
			roundedCorners={ roundedCorners }
			columnWidths={ columnWidths }
		/>
	);
}
