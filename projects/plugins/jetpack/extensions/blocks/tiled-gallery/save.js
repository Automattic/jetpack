import { useBlockProps } from '@wordpress/block-editor';
import clsx from 'clsx';
import { getActiveStyleName } from '../../shared/block-styles';
import { LAYOUT_STYLES } from './constants';
import { defaultColumnsNumber } from './edit';
import Layout from './layout';

export default function TiledGallerySave( { attributes } ) {
	const { imageFilter, images } = attributes;
	const blockProps = useBlockProps.save();

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
		<div { ...blockProps } className={ clsx( blockProps.className, className ) }>
			<Layout
				align={ align }
				columns={ columns }
				imageFilter={ imageFilter }
				images={ images }
				isSave
				layoutStyle={ getActiveStyleName( LAYOUT_STYLES, className ) }
				linkTo={ linkTo }
				roundedCorners={ roundedCorners }
				columnWidths={ columnWidths }
			/>
		</div>
	);
}
