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

	if ( data.data.length === 0 ) return null;

	const point = position === 'start' ? data.data[ 0 ] : data.data[ data.data.length - 1 ];

	const x = xScale( accessors.xAccessor( point ) );
	const y = yScale( accessors.yAccessor( point ) );

	if ( typeof x !== 'number' || typeof y !== 'number' ) return null;

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
