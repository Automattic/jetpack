/**
 * External dependencies
 */
import { GeoChart } from '@automattic/charts';
import { location } from '@jetpack-premium-analytics/icons';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalGrid as Grid,
} from '@wordpress/components';
import { useResizeObserver } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChartEmptyState } from '../../components';
import { LeaderboardChart, LeaderboardLabel } from '../../components/chart-leaderboard';
import { WidgetLoadingOverlay } from '../../components/widget-loading-overlay';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../../components/widget-root';
import { RESIZE_DEBOUNCE_MS } from '../../constants';
import { flagUrl } from '../../helpers';
import { useWidgetError } from '../../hooks';
import { useVisitorsByLocation, type Region } from './use-visitors-by-location';
import styles from './visitors-by-location-widget.module.scss';

function isRegion( value: unknown ): value is Region {
	return value === 'US' || value === 'world';
}

function closestHTMLElement(
	el: Element | null | undefined,
	selector: string
): HTMLElement | null {
	const match = el?.closest( selector );
	return match instanceof HTMLElement ? match : null;
}

// Below this rendered tile width the side-by-side map + leaderboard layout is
// too cramped, so we collapse to the map-only ("minimized") layout. This
// roughly corresponds to a single-column dashboard tile (~381px) while the
// two-column layout (~786px) stays above it.
const MAP_ONLY_MAX_TILE_WIDTH = 480;

export function VisitorsByLocationWidget() {
	const { reportParams } = useWidgetRootContext();
	const [ region, setRegion ] = useState< Region >( 'US' );
	const [ isMinimized, setIsMinimized ] = useState( false );
	const rootRef = useRef< HTMLDivElement | null >( null );
	const tileButtonRef = useRef< HTMLElement | null >( null );
	const resizeDebounceTimeoutRef = useRef< ReturnType< typeof setTimeout > | null >( null );

	const {
		geoData,
		leaderboardData,
		isLoading,
		isFetching,
		hasData,
		hasComparison,
		isError,
		error,
		refetch,
	} = useVisitorsByLocation( reportParams, region );

	const isInitialLoading = isLoading && ! hasData;
	const isRefetching = isFetching && hasData;

	const leaderboardDataWithImages = useMemo(
		() =>
			leaderboardData.map( item => {
				const imageUrl = flagUrl( region === 'US' ? 'us' : item.id );
				const labelText = typeof item.label === 'string' ? item.label : '';
				const imageAlt =
					region === 'US'
						? __( 'United States flag', 'jetpack-premium-analytics' )
						: sprintf(
								/* translators: %s is the country name */
								__( 'Flag of %s', 'jetpack-premium-analytics' ),
								labelText
						  );

				return {
					...item,
					label: (
						<LeaderboardLabel
							label={ labelText }
							imageAlt={ imageAlt }
							imageClassName={ styles.leaderboardImage }
							{ ...( imageUrl ? { imageUrl } : {} ) }
						/>
					),
				};
			} ),
		[ leaderboardData, region ]
	);

	const updateIsMinimized = useCallback( () => {
		// Measure the dashboard tile when present, otherwise the widget root.
		// The rendered width is a reliable signal across the real dashboard grid
		// (where the grid span lives on a parent wrapper, not the sortable tile),
		// the mobile stacked layout, and standalone embeddings.
		const measuredEl = tileButtonRef.current ?? rootRef.current;
		if ( ! measuredEl ) {
			return;
		}

		const width = measuredEl.getBoundingClientRect().width;
		const nextIsMinimized = width > 0 && width < MAP_ONLY_MAX_TILE_WIDTH;

		// Avoid scheduling React state updates when nothing changes.
		setIsMinimized( prev => ( prev === nextIsMinimized ? prev : nextIsMinimized ) );
	}, [] );

	const debouncedResizeUpdate = useCallback( () => {
		// ResizeObserver can fire very frequently while the tile is being resized.
		// Debounce to reduce rerenders, mirroring GeoChart's internal resize debounce.
		if ( resizeDebounceTimeoutRef.current ) {
			clearTimeout( resizeDebounceTimeoutRef.current );
		}
		resizeDebounceTimeoutRef.current = setTimeout( updateIsMinimized, RESIZE_DEBOUNCE_MS );
	}, [ updateIsMinimized ] );

	const resizeObserverRef = useResizeObserver( () => {
		debouncedResizeUpdate();
	} );

	useEffect( () => {
		const root = rootRef.current;

		// DataViews picker grid: always render the simplified (map-only) tile
		// and avoid attaching any observers/listeners.
		const dataViewsPickerGrid = closestHTMLElement( root, '.dataviews-view-picker-grid' );

		if ( dataViewsPickerGrid ) {
			tileButtonRef.current = null;
			setIsMinimized( true );
			return;
		}

		// Dashboard tile: react to changes in the tile's rendered width. Fall
		// back to the widget root for standalone embeddings that aren't wrapped
		// in a sortable dashboard tile.
		const tileButton = closestHTMLElement(
			root,
			'[role="button"][aria-roledescription="sortable"]'
		);

		tileButtonRef.current = tileButton;

		const observedEl = tileButton ?? root;
		if ( ! observedEl ) {
			setIsMinimized( false );
			return;
		}

		updateIsMinimized();

		// `useResizeObserver` returns a ref callback. We can attach it
		// programmatically to `observedEl` even though it may be outside this
		// component's render tree.
		resizeObserverRef( observedEl );

		return () => {
			resizeObserverRef( null );
			tileButtonRef.current = null;
			if ( resizeDebounceTimeoutRef.current ) {
				clearTimeout( resizeDebounceTimeoutRef.current );
				resizeDebounceTimeoutRef.current = null;
			}
		};
	}, [ resizeObserverRef, updateIsMinimized, leaderboardData ] );

	const geoChartProps =
		region === 'US'
			? ( {
					region,
					resolution: 'provinces',
			  } as const )
			: {};

	const geoChart = (
		<GeoChart data={ geoData } resizeDebounceTime={ RESIZE_DEBOUNCE_MS } { ...geoChartProps } />
	);

	const hasError = useWidgetError( isError, error, refetch );

	if ( hasError ) {
		return null;
	}

	if ( isInitialLoading ) {
		return <WidgetLoadingOverlay />;
	}

	if ( ! leaderboardData || leaderboardData.length === 0 ) {
		return (
			<>
				<ChartEmptyState icon={ location } />
				{ isRefetching && <WidgetLoadingOverlay /> }
			</>
		);
	}

	return (
		<>
			<div ref={ rootRef } className={ styles.root }>
				{ isMinimized ? (
					<div className={ styles.container }>{ geoChart }</div>
				) : (
					<Grid
						columns={ 2 }
						gap={ 6 }
						className={ styles.container }
						templateColumns="400fr 280fr"
						templateRows="auto 1fr"
					>
						<div className={ styles.toggleControl }>
							<ToggleGroupControl
								__next40pxDefaultSize
								isBlock
								hideLabelFromVision
								label={ __( 'Location', 'jetpack-premium-analytics' ) }
								onChange={ value => {
									if ( isRegion( value ) ) {
										setRegion( value );
									}
								} }
								value={ region }
							>
								<ToggleGroupControlOption
									value="US"
									label={ __( 'United States', 'jetpack-premium-analytics' ) }
								/>
								<ToggleGroupControlOption
									value="world"
									label={ __( 'Worldwide', 'jetpack-premium-analytics' ) }
								/>
							</ToggleGroupControl>
						</div>

						<div className={ styles.geoChart }>{ geoChart }</div>

						<LeaderboardChart
							data={ leaderboardDataWithImages }
							withOverlayLabel={ true }
							withComparison={ hasComparison }
							showLegend={ false }
							dataFormat={ {
								type: 'number',
								options: { useMultipliers: true, decimals: 0 },
							} }
							className={ styles.leaderboardChart }
						/>
					</Grid>
				) }
			</div>
			{ isRefetching && <WidgetLoadingOverlay /> }
		</>
	);
}
