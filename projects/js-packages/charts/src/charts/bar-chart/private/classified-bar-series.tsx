import { DataContext, GlyphSeries } from '@visx/xychart';
import clsx from 'clsx';
import { useCallback, useContext, useMemo } from 'react';
import { createGroupScale } from './band-scale';
import { getValueScaleBaseline } from './comparison-bars-geometry';
import type { BandScale } from './band-scale';
import type { DataPointDate } from '../../../types';
import type { BarChartProps } from '../types';
import type { AxisScale } from '@visx/axis';
import type { GlyphProps, SeriesProps } from '@visx/xychart';

type Props = Pick<
	SeriesProps< AxisScale, AxisScale, DataPointDate >,
	'xAccessor' | 'yAccessor'
> & {
	dataKey: string;
	data: DataPointDate[];
	colorAccessor: ( datum: DataPointDate ) => string;
	barClassName: NonNullable< BarChartProps[ 'barClassName' ] >;
	primaryKeys: string[];
	groupPadding: number;
};

const ClassifiedBarSeries = ( { barClassName, primaryKeys, groupPadding, ...props }: Props ) => {
	const { xScale, yScale, horizontal } = useContext( DataContext );
	const bandScale = ( horizontal ? yScale : xScale ) as BandScale | undefined;
	const valueScale = horizontal ? xScale : yScale;
	const groupScale = useMemo(
		() => createGroupScale( primaryKeys, bandScale?.bandwidth?.() ?? 0, groupPadding ),
		[ primaryKeys, bandScale, groupPadding ]
	);
	const renderGlyph = useCallback(
		( { datum, x, y, color }: GlyphProps< DataPointDate > ) => {
			if ( ! bandScale?.bandwidth || ! valueScale ) return null;
			const baseline = getValueScaleBaseline(
				valueScale as Parameters< typeof getValueScaleBaseline >[ 0 ]
			);
			const position =
				Number( bandScale( ( horizontal ? props.yAccessor : props.xAccessor )( datum ) ) ) +
				( groupScale( props.dataKey ) ?? 0 );
			const value = horizontal ? x : y;
			return (
				<rect
					className={ clsx( 'visx-bar', barClassName( datum ) ) }
					x={ horizontal ? Math.min( value, baseline ) : position }
					y={ horizontal ? position : Math.min( value, baseline ) }
					width={ horizontal ? Math.abs( value - baseline ) : groupScale.bandwidth() }
					height={ horizontal ? groupScale.bandwidth() : Math.abs( value - baseline ) }
					fill={ color }
				/>
			);
		},
		[
			bandScale,
			valueScale,
			horizontal,
			groupScale,
			props.dataKey,
			props.xAccessor,
			props.yAccessor,
			barClassName,
		]
	);
	return <GlyphSeries { ...props } renderGlyph={ renderGlyph } />;
};

export default ClassifiedBarSeries;
