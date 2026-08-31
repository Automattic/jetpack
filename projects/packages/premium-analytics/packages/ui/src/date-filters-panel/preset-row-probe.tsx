/**
 * External dependencies
 */
import { Button, Icon } from '@jetpack-premium-analytics/externals';
import { chevronDown } from '@wordpress/icons';
import { memo, useCallback, useLayoutEffect, useRef, type ReactNode } from 'react';
/**
 * Internal dependencies
 */
import './preset-row-probe.scss';

export type PresetRowProbeProps = {
	/** Pill labels in display order. */
	presets: ReadonlyArray< { id: string; label: string } >;

	/**
	 * The label the real trigger is showing. "Custom" versus a formatted range
	 * differs by ~40px. Absent when the surface offers no custom range, so the
	 * probe leaves the trigger out of the measured row too.
	 */
	customTriggerLabel?: string;

	/**
	 * The period navigation, as the panel renders it. Its width moves with the
	 * forward arrow appearing and disappearing, which the row has to absorb.
	 */
	navigation?: ReactNode;

	/**
	 * The comparison control, as the panel renders it. It has no abbreviated
	 * form, so its width is a fixed cost the presets have to absorb.
	 */
	comparison?: ReactNode;

	/**
	 * The chart interval control, as the panel renders it. A glyph, so its width
	 * is the same fixed cost in every locale.
	 */
	interval?: ReactNode;

	/** Reports the row's natural width whenever it changes. */
	onMeasure: ( width: number ) => void;
};

/**
 * Measures the date-controls row with labels spelled out, in the DOM. Always
 * full-length — measuring the live (possibly-abbreviated) row would oscillate.
 * Memoized: the panel re-renders every resize step, this only moves with labels.
 */
function PresetRowProbeComponent( {
	presets,
	customTriggerLabel,
	navigation,
	comparison,
	interval,
	onMeasure,
}: PresetRowProbeProps ) {
	const rowRef = useRef< HTMLDivElement >( null );

	// Last reported width, so an identical measurement doesn't push a new value
	// downstream. A ref, not state: state would change `measure`'s identity and
	// re-fire the effect below for the same answer.
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

	// `max-content`, so the width only moves on a render that changes the row.
	useLayoutEffect( () => {
		measure();
	}, [ measure, presets, customTriggerLabel, navigation, comparison, interval ] );

	// Web fonts land after first paint and shift the metrics. Insurance: the
	// dashboard ships none today.
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
			<div className="preset-row-probe__panel" ref={ rowRef }>
				{ navigation }

				<div className="preset-row-probe__row">
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
					{ customTriggerLabel !== undefined && (
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
					) }
				</div>

				{ /* The real controls, not mirrors: the panel hands the same elements
				     here and to the row, so the two cannot drift. */ }
				{ comparison }
				{ interval }
			</div>
		</div>
	);
}

export const PresetRowProbe = memo( PresetRowProbeComponent );
