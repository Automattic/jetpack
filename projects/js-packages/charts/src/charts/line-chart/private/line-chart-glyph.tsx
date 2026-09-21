import { DataContext } from '@visx/xychart';
import { useContext } from 'react';
import type { LineChartGlyphProps } from '../types';
import type { FC } from 'react';

const toNumber = ( val?: number | string | null ): number | undefined => {
	const num = typeof val === 'number' ? val : parseFloat( val );
	return isNaN( num ) ? undefined : num;
};

const LineChartGlyph: FC< LineChartGlyphProps > = ( {
	data,
	index,
	color,
	glyphStyle,
	renderGlyph,
	accessors,
	position,
} ) => {
	const { xScale, yScale } = useContext( DataContext ) || {};
	if ( ! xScale || ! yScale ) return null;

	// A `null` bucket scales to `undefined`, not `NaN`, so `find`/`findLast` skip it
	// to land the edge glyph on the nearest real reading instead of dropping it.
	const hasFiniteY = ( datum: ( typeof data.data )[ number ] ) => {
		const scaledY = yScale( accessors.yAccessor( datum ) );
		return typeof scaledY === 'number' && Number.isFinite( scaledY );
	};

	const point =
		position === 'start' ? data.data.find( hasFiniteY ) : data.data.findLast( hasFiniteY );

	if ( ! point ) return null;

	const x = xScale( accessors.xAccessor( point ) );
	const y = yScale( accessors.yAccessor( point ) );

	if (
		typeof x !== 'number' ||
		typeof y !== 'number' ||
		! Number.isFinite( x ) ||
		! Number.isFinite( y )
	) {
		return null;
	}

	const size = Math.max( 0, toNumber( glyphStyle?.radius ) ?? 4 );

	return renderGlyph( {
		key: `${ position }-glyph-${ data.label }`,
		index,
		datum: point,
		color,
		size,
		x,
		y,
		glyphStyle,
		position,
	} );
};

export default LineChartGlyph;
