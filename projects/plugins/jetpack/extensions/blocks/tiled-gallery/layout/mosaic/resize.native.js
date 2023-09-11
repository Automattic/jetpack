import { Platform } from '@wordpress/element';
import { GUTTER_WIDTH } from '../../constants';

/**
 * Distribute a difference across ns so that their sum matches the target
 *
 * @param   {Array<number>}  parts  - Array of numbers to fit
 * @param   {number}         target - Number that sum should match
 * @returns {Array<number>}         - Adjusted parts
 */
function adjustFit( parts, target ) {
	const diff = target - parts.reduce( ( sum, n ) => sum + n, 0 );
	const partialDiff = diff / parts.length;
	return parts.map( p => p + partialDiff );
}

export function handleRowResize( row, width ) {
	return applyRowRatio( row, getRowRatio( row ), width );
}

function getRowRatio( row ) {
	const result = getRowCols( row )
		.map( getColumnRatio )
		.reduce(
			( [ ratioA, weightedRatioA ], [ ratioB, weightedRatioB ] ) => {
				return [ ratioA + ratioB, weightedRatioA + weightedRatioB ];
			},
			[ 0, 0 ]
		);
	return result;
}

export function getGalleryRows( gallery ) {
	return Array.from( gallery.querySelectorAll( '.tiled-gallery__row' ) );
}

function getRowCols( row ) {
	return Platform.select( {
		web: () => Array.from( row.querySelectorAll( '.tiled-gallery__col' ) ),
		native: () => row,
	} )();
}

function getColImgs( col ) {
	return Platform.select( {
		web: () =>
			Array.from(
				col.querySelectorAll( '.tiled-gallery__item > img, .tiled-gallery__item > a > img' )
			),
		native: () => col.map( img => img.props ),
	} )();
}

function getColumnRatio( col ) {
	const imgs = getColImgs( col );
	const imgCount = imgs.length;
	const ratio =
		1 /
		imgs.map( getImageRatio ).reduce( ( partialColRatio, imgRatio ) => {
			return partialColRatio + 1 / imgRatio;
		}, 0 );
	const result = [ ratio, ratio * imgCount || 1 ];
	return result;
}

function getImageRatio( img ) {
	const w = Platform.select( {
		web: () => parseInt( img.dataset.width, 10 ),
		native: () => img.width,
	} )();
	const h = Platform.select( {
		web: () => parseInt( img.dataset.height, 10 ),
		native: () => img.height,
	} )();
	const result = w && ! Number.isNaN( w ) && h && ! Number.isNaN( h ) ? w / h : 1;
	return result;
}

function applyRowRatio( row, [ ratio, weightedRatio ], width ) {
	const colCount = Platform.select( {
		web: () => row.childElementCount,
		native: () => row.length,
	} )();
	const rawHeight = ( 1 / ratio ) * ( width - GUTTER_WIDTH * ( colCount - 1 ) - weightedRatio );

	return applyColRatio( row, {
		rawHeight,
		rowWidth: width - GUTTER_WIDTH * ( colCount - 1 ),
	} );
}

function applyColRatio( row, { rawHeight, rowWidth } ) {
	const cols = getRowCols( row );

	const colWidths = cols.map( col => {
		const imgCount = Platform.select( {
			web: () => col.childElementCount,
			native: () => col.length,
		} )();
		return ( rawHeight - GUTTER_WIDTH * ( imgCount - 1 ) ) * getColumnRatio( col )[ 0 ];
	} );

	const adjustedWidths = adjustFit( colWidths, rowWidth );

	cols.forEach( ( col, i ) => {
		const rawWidth = colWidths[ i ];
		const width = adjustedWidths[ i ];
		const imgCount = Platform.select( {
			web: () => col.childElementCount,
			native: () => col.length,
		} )();
		applyImgRatio( col, {
			colHeight: rawHeight - GUTTER_WIDTH * ( imgCount - 1 ),
			width,
			rawWidth,
		} );
	} );

	const colWidthPercentages = adjustedWidths.map( adjustedWidth =>
		parseFloat( ( adjustedWidth / rowWidth ) * 100 ).toFixed( 5 )
	);

	return colWidthPercentages;
}

function applyImgRatio( col, { colHeight, width, rawWidth } ) {
	const imgHeights = getColImgs( col ).map( img => rawWidth / getImageRatio( img ) );
	const adjustedHeights = adjustFit( imgHeights, colHeight );

	Platform.select( {
		web: () => {
			// Set size of col children, not the <img /> element
			Array.from( col.children ).forEach( ( item, i ) => {
				const height = adjustedHeights[ i ];
				item.setAttribute( 'style', `height:${ height }px;width:${ width }px;` );
			} );
		},
	} )();
}
