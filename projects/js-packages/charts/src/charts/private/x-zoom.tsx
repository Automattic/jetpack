import { DataContext } from '@visx/xychart';
import { __ } from '@wordpress/i18n';
import { useCallback, useContext, useMemo, useState } from 'react';
import styles from './x-zoom.module.scss';
import type { SingleChartRef } from './single-chart-context';
import type { AxisScale } from '@visx/axis';
import type { EventHandlerParams } from '@visx/xychart';
import type { ReactNode, RefObject } from 'react';

const MIN_DRAG_PIXELS = 6;

type Drag = { a: number; b: number };
type PointerHandler = ( params: EventHandlerParams< object > ) => void;

/**
 * Drag-to-zoom state + pointer handlers for an XY chart. Designed to be
 * embedded in a chart parent: the parent owns the result, spreads the
 * `domain` into its `xScale.domain` config, and renders the selection
 * rect and reset button this returns.
 *
 * The X scale `.invert()` is read lazily from the chart's existing
 * `internalChartRef.getScales()` at commit time, so no DataContext access
 * is required from the parent.
 *
 * @param params                            - Hook params.
 * @param params.enabled                    - When false, the hook becomes a passthrough.
 * @param params.chartRef                   - Chart's internal scales ref.
 * @param params.userHandlers               - User-supplied pointer handlers to chain.
 * @param params.userHandlers.onPointerDown - Forwarded user pointerdown handler.
 * @param params.userHandlers.onPointerMove - Forwarded user pointermove handler.
 * @param params.userHandlers.onPointerUp   - Forwarded user pointerup handler.
 * @return An object with `domain`, `drag`, `reset`, and chained `handlers`.
 */
export function useXZoom< T extends Date | number = Date >( {
	enabled,
	chartRef,
	userHandlers,
}: {
	enabled: boolean;
	chartRef: RefObject< SingleChartRef | null >;
	userHandlers?: {
		onPointerDown?: PointerHandler;
		onPointerMove?: PointerHandler;
		onPointerUp?: PointerHandler;
	};
} ) {
	const [ domain, setDomain ] = useState< [ T, T ] | null >( null );
	const [ drag, setDrag ] = useState< Drag | null >( null );

	const reset = useCallback( () => setDomain( null ), [] );

	const onPointerDown = useCallback< PointerHandler >(
		params => {
			userHandlers?.onPointerDown?.( params );
			if ( ! enabled || ! params.svgPoint ) return;
			setDrag( { a: params.svgPoint.x, b: params.svgPoint.x } );
		},
		[ enabled, userHandlers ]
	);

	const onPointerMove = useCallback< PointerHandler >(
		params => {
			userHandlers?.onPointerMove?.( params );
			if ( ! enabled || ! params.svgPoint ) return;
			setDrag( current => ( current ? { a: current.a, b: params.svgPoint!.x } : current ) );
		},
		[ enabled, userHandlers ]
	);

	const onPointerUp = useCallback< PointerHandler >(
		params => {
			userHandlers?.onPointerUp?.( params );
			if ( ! enabled ) return;
			const finalDrag = drag;
			setDrag( null );
			if ( ! finalDrag ) return;
			const lo = Math.min( finalDrag.a, finalDrag.b );
			const hi = Math.max( finalDrag.a, finalDrag.b );
			if ( hi - lo < MIN_DRAG_PIXELS ) return;
			const xScale = chartRef.current?.getScales()?.xScale as
				| ( AxisScale & { invert?: ( v: number ) => T } )
				| undefined;
			if ( ! xScale || typeof xScale.invert !== 'function' ) return;
			setDomain( [ xScale.invert( lo ), xScale.invert( hi ) ] );
		},
		[ enabled, drag, chartRef, userHandlers ]
	);

	return useMemo(
		() => ( {
			domain,
			drag,
			reset,
			handlers: { onPointerDown, onPointerMove, onPointerUp },
		} ),
		[ domain, drag, reset, onPointerDown, onPointerMove, onPointerUp ]
	);
}

/**
 * Live selection rectangle drawn inside `<XYChart>` while the user is
 * dragging. Reads plot dimensions from visx's `DataContext`.
 *
 * @param props      - Props.
 * @param props.drag - Current drag, or null when idle.
 * @return JSX or null.
 */
export function ZoomSelectionRect( { drag }: { drag: Drag | null } ) {
	const { margin, innerHeight } = useContext( DataContext );
	if ( ! drag || drag.a === drag.b ) return null;
	const x = Math.min( drag.a, drag.b );
	const w = Math.abs( drag.b - drag.a );
	return (
		<rect
			className={ styles[ 'x-zoom__selection' ] }
			x={ x }
			y={ margin?.top ?? 0 }
			width={ w }
			height={ innerHeight ?? 0 }
			data-testid="chart-zoom-selection"
		/>
	);
}

/**
 * Wraps a chart's series in a group that is clipped to the inner plot rectangle
 * while `active`. Reads the plot geometry from visx's `DataContext` (the same
 * source as `ZoomSelectionRect`), so the host charts don't compute any margins.
 * The group is always rendered (only its `clip-path` toggles) so toggling zoom
 * never remounts or re-animates the series.
 *
 * @param props          - Props.
 * @param props.active   - Whether to clip (e.g. `zoomable`, or `zoomable && zoomed`).
 * @param props.chartId  - Chart id; used to build a unique clip-path id.
 * @param props.children - The series to clip.
 * @return JSX element.
 */
export function ZoomClip( {
	active,
	chartId,
	children,
}: {
	active: boolean;
	chartId?: string;
	children: ReactNode;
} ) {
	const { margin, innerWidth, innerHeight } = useContext( DataContext );
	// Sanitise the chart id to a valid SVG/CSS id, and keep it unique per chart.
	const id = `chart-zoom-clip-${ String( chartId ?? '' ).replace( /[^A-Za-z0-9_-]/g, '' ) }`;
	const clip = active && ( innerWidth ?? 0 ) > 0 && ( innerHeight ?? 0 ) > 0;
	return (
		<>
			{ clip && (
				<defs>
					<clipPath id={ id } data-testid="chart-zoom-clip">
						<rect
							x={ margin?.left ?? 0 }
							y={ margin?.top ?? 0 }
							width={ innerWidth }
							height={ innerHeight }
						/>
					</clipPath>
				</defs>
			) }
			<g clipPath={ clip ? `url(#${ id })` : undefined } data-testid="chart-series-clip-group">
				{ children }
			</g>
		</>
	);
}

/**
 * Visible icon-only reset button rendered as an HTML overlay on top of
 * the chart container. The host should wrap its SVG in a `position: relative`
 * container so the button anchors correctly.
 *
 * @param props         - Props.
 * @param props.onClick - Click handler. Typically the `reset` from `useXZoom`.
 * @return JSX element.
 */
export function ZoomResetButton( { onClick }: { onClick: () => void } ) {
	const label = __( 'Reset zoom', 'jetpack-charts' );
	return (
		<button
			type="button"
			className={ styles[ 'x-zoom__reset' ] }
			onClick={ onClick }
			aria-label={ label }
			title={ label }
			data-testid="chart-zoom-reset"
		>
			<svg
				className={ styles[ 'x-zoom__reset-icon' ] }
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
				focusable="false"
			>
				<circle cx="10" cy="10" r="6" />
				<line x1="15" y1="15" x2="20" y2="20" />
				<line x1="7" y1="10" x2="13" y2="10" />
			</svg>
		</button>
	);
}
