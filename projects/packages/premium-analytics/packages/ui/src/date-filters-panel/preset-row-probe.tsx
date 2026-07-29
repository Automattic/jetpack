/**
 * External dependencies
 */
import { chevronDown } from '@wordpress/icons';
import { Button, Icon } from '@wordpress/ui';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
/**
 * Internal dependencies
 */
import type { PresetRowWidths } from '../date-range-layout';
import './preset-row-probe.scss';

export type PresetRowProbeProps = {
	/** Pill labels in display order. A preset with no short form reuses its full label. */
	presets: ReadonlyArray< { id: string; label: string; shortLabel?: string } >;

	/**
	 * The label the real trigger is showing. It shares the group with the pills,
	 * and "Custom" versus a formatted range differs by ~40px.
	 */
	customTriggerLabel: string;

	/** Reports both natural widths whenever they change. */
	onMeasure: ( widths: PresetRowWidths ) => void;
};

/**
 * Measures what the preset row needs at each label length.
 *
 * Measured in the DOM rather than computed: the width depends on the font
 * resolved for the locale's script, the button padding tokens, and the group's
 * borders.
 *
 * Renders both forms unconditionally, so its widths never depend on the active
 * mode. Measuring the live row would oscillate instead: shortening the labels
 * shrinks the row, the full labels then look like they fit, and back again.
 *
 * @param props                    - Component props.
 * @param props.presets            - Pill labels in display order.
 * @param props.customTriggerLabel - The custom trigger's current label.
 * @param props.onMeasure          - Receives both natural widths.
 */
export function PresetRowProbe( { presets, customTriggerLabel, onMeasure }: PresetRowProbeProps ) {
	const fullRef = useRef< HTMLDivElement >( null );
	const abbreviatedRef = useRef< HTMLDivElement >( null );

	// Last reported pair, so identical widths don't push a new object downstream.
	const [ reported, setReported ] = useState< PresetRowWidths | null >( null );

	const measure = useCallback( () => {
		const full = fullRef.current?.getBoundingClientRect().width ?? 0;
		const abbreviated = abbreviatedRef.current?.getBoundingClientRect().width ?? 0;

		if ( ! full || ! abbreviated ) {
			return;
		}

		// Sub-pixel jitter from fractional layout would otherwise churn the mode.
		const next = { full: Math.ceil( full ), abbreviated: Math.ceil( abbreviated ) };

		if ( reported?.full === next.full && reported?.abbreviated === next.abbreviated ) {
			return;
		}

		setReported( next );
		onMeasure( next );
	}, [ onMeasure, reported ] );

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

	const row = ( abbreviated: boolean ) => (
		<>
			{ presets.map( preset => (
				<Button
					key={ preset.id }
					className="date-range-quick-presets__pill"
					variant="minimal"
					tone="neutral"
					size="small"
					tabIndex={ -1 }
				>
					{ abbreviated ? preset.shortLabel ?? preset.label : preset.label }
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
		</>
	);

	return (
		// @ts-expect-error -- `inert` is valid HTML but missing from this React version's types.
		<div className="preset-row-probe" aria-hidden="true" inert="">
			<div className="preset-row-probe__row" ref={ fullRef }>
				{ row( false ) }
			</div>
			<div className="preset-row-probe__row" ref={ abbreviatedRef }>
				{ row( true ) }
			</div>
		</div>
	);
}
