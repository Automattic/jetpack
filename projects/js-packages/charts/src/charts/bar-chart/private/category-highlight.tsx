import { DataContext, TooltipContext } from '@visx/xychart';
import { useContext, useEffect, useMemo, useRef } from 'react';
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

	const lastNotification = useRef< {
		callback: Props[ 'onChange' ];
		selection: CategoryHighlightSelection | null;
	} >();
	useEffect( () => {
		const previous = lastNotification.current;
		const unchanged =
			previous?.callback === onChange &&
			( previous?.selection === selection ||
				( previous?.selection &&
					selection &&
					previous.selection.datum === selection.datum &&
					previous.selection.x === selection.x &&
					previous.selection.y === selection.y &&
					previous.selection.width === selection.width &&
					previous.selection.height === selection.height ) );
		if ( unchanged ) {
			return;
		}
		lastNotification.current = { callback: onChange, selection };
		onChange?.( selection );
	}, [ onChange, selection ] );

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
			fill="var(--a8c-charts-color-category-highlight, var(--wpds-color-background-surface-neutral-weak))"
		/>
	);
}
