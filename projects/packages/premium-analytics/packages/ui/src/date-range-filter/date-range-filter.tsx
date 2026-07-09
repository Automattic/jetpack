/**
 * External dependencies
 */
import { PRESET_CUSTOM, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
import { useResizeObserver } from '@wordpress/compose';
import { calendar } from '@wordpress/icons';
import { Stack, Icon } from '@wordpress/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import {
	MOBILE_CONTAINER_WIDTH_THRESHOLD,
	WIDE_CALENDAR_CONTAINER_THRESHOLD,
} from '../date-range-layout';
import { DateRangePopover } from '../date-range-popover';
import { DateRangeQuickPresets, getSurfacePresetId } from '../date-range-quick-presets';
import type { DateRange } from '../date-range-popover';
import './date-range-filter.scss';

type DateRangePopoverProps = Parameters< typeof DateRangePopover >[ 0 ];

export type DateRangeFilterProps = DateRangePopoverProps;

/**
 * Primary date-range control: rolling-window presets on the surface and a
 * separate custom-range popover with calendar inputs only.
 */
export function DateRangeFilter( {
	presetId,
	range,
	appliedPresetId,
	appliedRange,
	onChange,
	onApply,
	onCancel,
	canApply,
	timeZone,
	containerElement,
	onOpenChange,
}: DateRangeFilterProps ) {
	const [ containerWidth, setContainerWidth ] = useState< number | null >( null );

	const handleResize = useCallback( ( entries: ResizeObserverEntry[] ) => {
		const entry = entries[ 0 ];
		if ( entry ) {
			setContainerWidth( entry.contentRect.width );
		}
	}, [] );

	const setObserverRef = useResizeObserver< HTMLElement >( handleResize );

	useEffect( () => {
		const element = containerElement ?? document.body;
		setObserverRef( element );
	}, [ containerElement, setObserverRef ] );

	const isCompact = containerWidth !== null && containerWidth < MOBILE_CONTAINER_WIDTH_THRESHOLD;
	const isWideScreen =
		containerWidth !== null && containerWidth >= WIDE_CALENDAR_CONTAINER_THRESHOLD;

	const surfacePresetId = useMemo(
		() => getSurfacePresetId( appliedPresetId ?? presetId ),
		[ appliedPresetId, presetId ]
	);

	const handlePresetSelect = useCallback(
		( nextRange: DateRange, nextPresetId: SelectablePresetId ) => {
			onChange( nextRange, nextPresetId );
			onApply();
		},
		[ onApply, onChange ]
	);

	return (
		<Stack className="date-range-filter" direction="row" gap="sm" wrap="wrap" align="center">
			<Icon icon={ calendar } size={ 20 } aria-hidden />

			<DateRangeQuickPresets
				value={ surfacePresetId }
				onSelect={ handlePresetSelect }
				timeZone={ timeZone }
				isCompact={ isCompact }
			/>

			<DateRangePopover
				presetId={ presetId ?? PRESET_CUSTOM }
				range={ range }
				appliedPresetId={ appliedPresetId }
				appliedRange={ appliedRange }
				onChange={ onChange }
				onApply={ onApply }
				onCancel={ onCancel }
				canApply={ canApply }
				timeZone={ timeZone }
				isWideScreen={ isWideScreen }
				onOpenChange={ onOpenChange }
			/>
		</Stack>
	);
}
