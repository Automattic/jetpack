import { DataContext, TooltipContext } from '@visx/xychart';
import { useContext, useEffect, useMemo, useRef } from 'react';
import { useDeepMemo } from '../../../hooks';
import { CATALOG_POINTERS } from '../../../providers/chart-context/private/catalog-pointers';
import type { DataPointDate } from '../../../types';

export type CategoryHighlightSelection = {
	datum: DataPointDate;
	x: number;
	y: number;
	width: number;
	height: number;
};

type Props = {
	visible: boolean;
	horizontal: boolean;
	onChange?: ( selection: CategoryHighlightSelection | null ) => void;
};

type BandScale = ( ( value: unknown ) => number | undefined ) & { bandwidth?: () => number };

/**
 * Render and report the active category using the chart’s registered scales.
 * @param root0            - Highlight options.
 * @param root0.visible    - Whether to paint the category band.
 * @param root0.horizontal - Whether categories run vertically.
 * @param root0.onChange   - Receives selected category geometry.
 * @return The optional category highlight.
 */
export function CategoryHighlight( { visible, horizontal, onChange }: Props ) {
	const { xScale, yScale, dataRegistry, margin, innerWidth, innerHeight } =
		useContext( DataContext );
	const { tooltipOpen, tooltipData } = useContext( TooltipContext );
	const nearest = tooltipData?.nearestDatum;
	const selection = useMemo( () => {
		if ( ! tooltipOpen || ! nearest ) {
			return null;
		}
		const scale = ( horizontal ? yScale : xScale ) as BandScale | undefined;
		const entry = dataRegistry?.get( nearest.key );
		const accessor = horizontal ? entry?.yAccessor : entry?.xAccessor;
		if ( ! scale?.bandwidth || ! accessor ) {
			return null;
		}
		const position = scale( accessor( nearest.datum ) );
		if ( position === undefined || ! Number.isFinite( position ) ) {
			return null;
		}
		return {
			datum: nearest.datum as DataPointDate,
			x: horizontal ? margin?.left ?? 0 : position,
			y: horizontal ? position : margin?.top ?? 0,
			width: horizontal ? innerWidth : scale.bandwidth(),
			height: horizontal ? scale.bandwidth() : innerHeight,
		};
	}, [
		tooltipOpen,
		nearest,
		horizontal,
		xScale,
		yScale,
		dataRegistry,
		margin,
		innerWidth,
		innerHeight,
	] );

	const stableSelection = useDeepMemo( selection );
	const onChangeRef = useRef( onChange );
	onChangeRef.current = onChange;
	useEffect( () => {
		onChangeRef.current?.( stableSelection );
	}, [ stableSelection ] );

	useEffect( () => () => onChangeRef.current?.( null ), [] );

	if ( ! visible || ! selection ) {
		return null;
	}
	const { x, y, width, height } = selection;
	return (
		<rect
			x={ x }
			y={ y }
			width={ width }
			height={ height }
			data-testid="bar-chart-category-highlight"
			pointerEvents="none"
			fill={ CATALOG_POINTERS.surfaceSecondary }
		/>
	);
}
