import { useBlockProps } from '@wordpress/block-editor';
import clsx from 'clsx';
import { getActiveStyleName } from '../../../../shared/block-styles';
import { defaultColumnsNumber } from '../../edit';
import { LAYOUT_STYLES } from './constants';
import Layout from './layout';

export default function TiledGallerySave( { attributes } ) {
	const { imageFilter, images } = attributes;
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
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
