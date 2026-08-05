/**
 * External dependencies
 */
import { Button, Icon } from '@jetpack-premium-analytics/externals';
import { chevronDown } from '@wordpress/icons';
import { memo, useCallback, useLayoutEffect, useRef } from 'react';
/**
 * Internal dependencies
 */
import './preset-row-probe.scss';

export type PresetRowProbeProps = {
	/** Pill labels in display order. */
	presets: ReadonlyArray< { id: string; label: string } >;

	/**
	 * The label the real trigger is showing. It shares the group with the pills,
	 * and "Custom" versus a formatted range differs by ~40px.
	 */
	customTriggerLabel: string;

	/** Reports the row's natural width whenever it changes. */
	onMeasure: ( width: number ) => void;
};

/**
 * Measures what the preset row needs with its labels spelled out.
 *
 * Measured in the DOM rather than computed: the width depends on the font
 * resolved for the locale's script, the button padding tokens, and the group's
 * borders.
 *
 * Renders the full form unconditionally, so the measurement never depends on
 * the active mode. Measuring the live row would oscillate instead: shortening
 * the labels shrinks the row, the full labels then look like they fit, and back
 * again.
 *
 * Exported memoized: the panel re-renders on every step of a resize, and this
 * output only moves when the labels do.
 *
 * @param {PresetRowProbeProps} props - The props for the PresetRowProbe component.
 * @return The preset row probe element.
 */
function PresetRowProbeComponent( {
	presets,
	customTriggerLabel,
	onMeasure,
}: PresetRowProbeProps ) {
	const rowRef = useRef< HTMLDivElement >( null );

	// Last reported width, so an identical measurement doesn't push a new value
	// downstream. A ref rather than state: holding it in state would change
	// `measure`'s identity on every measurement, re-firing the effect below and
	// costing a second layout read to reach the same answer.
	const reportedRef = useRef< number | null >( null );

	const measure = useCallback( () => {
		const width = rowRef.current?.getBoundingClientRect().width ?? 0;

		if ( ! width ) {
			return;
		}

		// Sub-pixel jitter from fractional layout would otherwise churn the mode.
		const next = Math.ceil( width );

		if ( reportedRef.current === next ) {
			return;
		}

		reportedRef.current = next;
		onMeasure( next );
	}, [ onMeasure ] );

	// The probe is `max-content`, so its width only moves when the labels or the
	// typography do, and both arrive as a render.
	useLayoutEffect( () => {
		measure();
	}, [ measure, presets, customTriggerLabel ] );

	// Web fonts land after first paint and shift the metrics. Insurance: nothing
	// in the dashboard ships one today.
	useLayoutEffect( () => {
		if ( ! document.fonts?.ready ) {
			return;
		}

		let cancelled = false;
		document.fonts.ready.then( () => {
			if ( ! cancelled ) {
				measure();
			}
		} );

		return () => {
			cancelled = true;
		};
	}, [ measure ] );

	return (
		// @ts-expect-error -- `inert` is valid HTML but missing from this React version's types.
		<div className="preset-row-probe" aria-hidden="true" inert="">
			<div className="preset-row-probe__row" ref={ rowRef }>
				{ presets.map( preset => (
					<Button
						key={ preset.id }
						className="date-range-quick-presets__pill"
						variant="minimal"
						tone="neutral"
						size="small"
						tabIndex={ -1 }
					>
						{ preset.label }
					</Button>
				) ) }
				<Button
					className="date-filters-panel-button"
					variant="minimal"
					tone="neutral"
					tabIndex={ -1 }
				>
					{ /* Mirrors the real trigger's markup so both measure the same box. */ }
					<span className="date-filters-panel-button__label">{ customTriggerLabel }</span>
					<Icon className="date-filters-panel-button__caret" icon={ chevronDown } size={ 18 } />
				</Button>
			</div>
		</div>
	);
}

export const PresetRowProbe = memo( PresetRowProbeComponent );
