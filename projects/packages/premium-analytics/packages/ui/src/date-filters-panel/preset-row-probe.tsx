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
	 * differs by ~40px.
	 */
	customTriggerLabel: string;

	/**
	 * The period navigation, as the panel renders it. Its width moves with the
	 * forward arrow appearing and disappearing, which the row has to absorb.
	 */
	navigation?: ReactNode;

	/**
	 * The chart interval control, as the panel renders it. A glyph, so its width
	 * is the same fixed cost in every locale.
	 */
	interval?: ReactNode;

	/**
	 * The comparison control, as the panel renders it. It has no abbreviated
	 * form, so its width is a fixed cost the presets have to absorb.
	 */
	comparison?: ReactNode;

	/** Reports the row's natural width whenever it changes. */
	onMeasure: ( width: number ) => void;
};

/**
 * Measures what the date-controls row needs with its labels spelled out.
 *
 * Measured in the DOM because the width depends on the font resolved for the
 * locale's script, the button padding tokens, and the group's borders.
 *
 * The presets render in their full form unconditionally: measuring the live row
 * oscillates, since shortening the labels shrinks it and the full labels then
 * look like they fit. The comparison control can be measured live because its
 * width follows the active preset rather than the label mode.
 *
 * Exported memoized: the panel re-renders on every step of a resize, and this
 * output only moves when the labels do.
 */
function PresetRowProbeComponent( {
	presets,
	customTriggerLabel,
	navigation,
	interval,
	comparison,
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
	}, [ measure, presets, customTriggerLabel, navigation, interval, comparison ] );

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

				{ /* The real controls, not mirrors: the panel hands the same elements
				     here and to the row, so the two cannot drift. */ }
				{ interval }
				{ comparison }
			</div>
		</div>
	);
}

export const PresetRowProbe = memo( PresetRowProbeComponent );
