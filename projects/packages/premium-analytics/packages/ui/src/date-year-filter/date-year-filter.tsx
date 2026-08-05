/**
 * External dependencies
 */
import {
	computePrimaryRange,
	getYearSurfacePresets,
	type DateRangePreset,
	type PrimaryPresetId,
	type YearSurfacePresetId,
} from '@jetpack-premium-analytics/datetime';
import { Button, SelectControl } from '@jetpack-premium-analytics/externals';
import { Composite } from '@wordpress/components';
import { useResizeObserver } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import type { DateRange } from '../date-range-popover';
import './date-year-filter.scss';

export type DateYearFilterProps = {
	/**
	 * Currently selected preset. A preset from another surface (a rolling
	 * window, or a custom range) leaves every pill unpressed.
	 */
	value?: PrimaryPresetId | null;

	/**
	 * Fired when the user picks all time or a single year.
	 */
	onSelect: ( range: DateRange, id: YearSurfacePresetId ) => void;

	/**
	 * IANA timezone string (e.g., 'America/New_York').
	 */
	timeZone: string;

	/**
	 * Oldest year to list, which is also where the all-time range starts — so
	 * "All time" never claims more history than the surface shows. Pass the
	 * site's first year of data once the host exposes it.
	 */
	startYear?: number;

	/**
	 * Forces the layout: `true` renders the years as a select, `false` keeps the
	 * pills. Left out, the filter picks the layout from the space it measures.
	 * Set it when a parent already owns that measurement, the way
	 * `DateFiltersPanel` does for its children.
	 */
	isCompact?: boolean;

	/**
	 * Element whose width decides the layout. Defaults to the document body,
	 * i.e. the viewport. Pass the row the filter sits in when that row is
	 * narrower than the page.
	 *
	 * It must be an element whose width does not depend on the filter's own
	 * width — a full-width row, not a `fit-content` wrapper — or the two
	 * measurements chase each other every time the layout switches.
	 */
	containerElement?: HTMLElement | null;
};

/**
 * Width the pills asked for, tagged with the list they were measured from.
 */
type PillsMeasurement = {
	presets: DateRangePreset< YearSurfacePresetId >[];
	width: number;
};

/**
 * Content-box width of an element, the same box a ResizeObserver reports, so
 * the first read and the observed updates can't disagree on a padded container.
 *
 * @param element - The element to measure.
 * @return The content width in pixels.
 */
function getContentWidth( element: HTMLElement ): number {
	const style = getComputedStyle( element );
	const padding =
		( parseFloat( style.paddingLeft ) || 0 ) + ( parseFloat( style.paddingRight ) || 0 );

	return Math.max( element.clientWidth - padding, 0 );
}

/**
 * Date filter for whole-history reporting: all time, then one pill per calendar
 * year, newest first. A sibling of `DateRangeFilter` for screens whose data is
 * read by year rather than by rolling window.
 */
export function DateYearFilter( {
	value = null,
	onSelect,
	timeZone,
	startYear,
	isCompact,
	containerElement,
}: DateYearFilterProps ) {
	const presets = useMemo(
		() => getYearSurfacePresets( timeZone, { startYear } ),
		[ timeZone, startYear ]
	);

	const items = useMemo(
		() => presets.map( ( { id, label } ) => ( { value: id, label } ) ),
		[ presets ]
	);

	const selectedItem = useMemo(
		() => items.find( item => item.value === value ) ?? null,
		[ items, value ]
	);

	/*
	 * Recompute the range at selection time: all time and the current year both
	 * end today, so the memoized ranges go stale on a page left open overnight.
	 */
	const selectPreset = useCallback(
		( presetId: string ) => {
			const preset = presets.find( p => p.id === presetId );
			if ( ! preset ) {
				return;
			}

			onSelect(
				computePrimaryRange( preset.id, timeZone, { startYear } ) ?? preset.range,
				preset.id
			);
		},
		[ onSelect, presets, timeZone, startYear ]
	);

	/*
	 * Layout measurement. How much room the pills need depends on how many years
	 * the surface lists, so a fixed breakpoint would either collapse a short
	 * surface too early or leave a long one wrapping across two rows. Measure
	 * both sides instead: the space available, and the width the pills ask for.
	 */
	const [ containerWidth, setContainerWidth ] = useState< number | null >( null );
	const [ measurement, setMeasurement ] = useState< PillsMeasurement | null >( null );

	const handleResize = useCallback( ( entries: ResizeObserverEntry[] ) => {
		const entry = entries[ 0 ];
		if ( entry ) {
			setContainerWidth( entry.contentRect.width );
		}
	}, [] );

	const setObserverRef = useResizeObserver< HTMLElement >( handleResize );

	/*
	 * Read the container before the browser paints, then hand it to the
	 * observer for later changes. Waiting for the observer's own first callback
	 * would land after the first paint, showing a frame of wrapped pills on a
	 * container too narrow for them; measuring here means React can commit the
	 * select in the same paint.
	 *
	 * The setter is called by hand rather than passed as a ref, so releasing the
	 * container falls to us: nothing else stops the observer on unmount, and the
	 * default container outlives every mount.
	 */
	useLayoutEffect( () => {
		const container = containerElement ?? document.body;

		setContainerWidth( getContentWidth( container ) );
		setObserverRef( container );

		return () => setObserverRef( null );
	}, [ containerElement, setObserverRef ] );

	/*
	 * The group wraps when it runs out of room, so its own box reports the width
	 * it was given rather than the width it needs: sum the pills instead.
	 *
	 * Measured from a ref rather than an effect, because the moment to measure is
	 * when the pills attach, which is also the moment the select gives way to
	 * them. Keyed on the preset list, so a list that changes under mounted pills
	 * is measured again.
	 */
	const measurePills = useCallback(
		( group: HTMLDivElement | null ) => {
			if ( ! group ) {
				return;
			}

			const pills = Array.from( group.children ).reduce(
				( total, pill ) => total + pill.getBoundingClientRect().width,
				0
			);

			setMeasurement( { presets, width: pills + ( group.offsetWidth - group.clientWidth ) } );
		},
		[ presets ]
	);

	/*
	 * A measurement answers for the list it was taken from. It survives the
	 * switch to the select, which is what brings the pills back at exactly the
	 * width they last asked for instead of flip-flopping around the boundary; it
	 * is dropped when the list itself changes, so a shorter list is never judged
	 * by a longer one's width.
	 */
	const pillsWidth = measurement?.presets === presets ? measurement.width : null;

	// Until both measurements land, assume the pills fit: they are the layout
	// this surface is designed around, and the first paint shouldn't flash a
	// select on a screen wide enough for them.
	const fitsPills = containerWidth === null || pillsWidth === null || containerWidth >= pillsWidth;

	if ( isCompact ?? ! fitsPills ) {
		return (
			<SelectControl
				className="date-year-filter__select"
				items={ items }
				value={ selectedItem }
				onValueChange={ item => {
					if ( item?.value ) {
						selectPreset( item.value );
					}
				} }
				label={ __( 'Time period', 'jetpack-premium-analytics-pkg' ) }
				hideLabelFromVision
				placeholder={ __( 'Select period', 'jetpack-premium-analytics-pkg' ) }
			/>
		);
	}

	/*
	 * One composite group: the pills share a single tab stop with arrow-key
	 * navigation between them.
	 */
	return (
		<Composite
			ref={ measurePills }
			className="date-year-filter__group"
			role="toolbar"
			aria-label={ __( 'Time period', 'jetpack-premium-analytics-pkg' ) }
			orientation="horizontal"
		>
			{ presets.map( ( { id, label } ) => (
				<Composite.Item
					key={ id }
					render={
						<Button
							className="date-year-filter__pill"
							variant="minimal"
							tone="neutral"
							size="small"
							aria-pressed={ value === id }
							onClick={ () => selectPreset( id ) }
						/>
					}
				>
					{ label }
				</Composite.Item>
			) ) }
		</Composite>
	);
}
