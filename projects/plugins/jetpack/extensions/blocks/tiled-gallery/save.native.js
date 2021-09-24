/**
 * Internal dependencies
 */
import Layout from './layout';
import { defaultColumnsNumber } from './edit';
import { getActiveStyleName } from '../../shared/block-styles';
import { LAYOUT_STYLES } from './constants';

import classnames from 'classnames';
import { RichText, useBlockProps, InnerBlocks } from '@wordpress/block-editor';

export default function TiledGallerySave( { attributes, innerBlocks } ) {
	if ( ! innerBlocks.length ) {
		return null;
	}

	const {
		align,
		className,
		columns = defaultColumnsNumber( innerBlocks ),
		linkTo,
		roundedCorners,
		columnWidths,
	} = attributes;

	const ids = innerBlocks.map( innerBlock => innerBlock.attributes.id );
	const cw = [ [ '100' ] ];

	console.log( 'ids', ids );

	return (
		<Layout
			{ ...useBlockProps.save( { className, ids, cw } ) }
			align={ align }
			className={ className }
			columns={ columns }
			images={ innerBlocks.map( innerBlock => ( {
				...innerBlock.attributes,
				height: 100,
				width: 100,
			} ) ) }
			isSave
			layoutStyle={ 'square' }
			linkTo={ linkTo }
			roundedCorners={ roundedCorners }
			columnWidths={ cw }
			ids={ ids }
		/>
	);
}
