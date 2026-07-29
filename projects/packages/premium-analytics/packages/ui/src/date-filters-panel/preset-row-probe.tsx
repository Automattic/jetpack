/**
 * External dependencies
 */
import { chevronDown } from '@wordpress/icons';
import { Button, Icon } from '@wordpress/ui';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
/**
 * Internal dependencies
 */
import './preset-row-probe.scss';

/**
 * Natural width of the preset row in each label form, in CSS pixels.
 */
export type PresetRowWidths = {
	full: number;
	abbreviated: number;
};

export type PresetRowProbeProps = {
	/**
	 * Labels for the pills, in display order. Both forms are measured, so a
	 * preset without a short form contributes its full label to both rows.
	 */
	presets: ReadonlyArray< { id: string; label: string; shortLabel?: string } >;

	/**
	 * The custom-range trigger's current label. It sits in the same group as the
	 * pills and is unaffected by the label mode, but it still competes for the
	 * row, so it has to be measured. Pass the label the real trigger is showing:
	 * "Custom" is much narrower than a formatted range like "Jul 13-26, 2026",
	 * and measuring the wrong one moves the boundary by ~40px.
	 */
	customTriggerLabel: string;

	/**
	 * Reports both natural widths whenever they change.
	 */
	onMeasure: ( widths: PresetRowWidths ) => void;
};

/**
 * Measures what the preset row would need at each label length.
 *
 * Rendered off-screen rather than derived arithmetically, because the answer
 * depends on the font actually resolved for the active locale's script, the
 * button padding tokens, and the group's own borders. Reproducing that in JS
 * would be a second implementation of the same layout, free to drift from the
 * first.
 *
 * Two properties make this safe to feed back into the layout it measures:
 *
 * 1. It renders both forms unconditionally, so its widths never depend on which
 *    mode is currently active. Measuring the live row instead would oscillate:
 *    shortening the labels shrinks the row, which makes the full labels look
 *    like they fit, which restores them, which overflows again.
 * 2. It is `position: absolute` and `inert`, so it contributes no layout of its
 *    own and cannot be reached by pointer, focus, or assistive tech.
 *
 * @param props                    - Component props.
 * @param props.presets            - Pill labels in display order.
 * @param props.customTriggerLabel - The custom trigger's current label.
 * @param props.onMeasure          - Receives both natural widths.
 */
export function PresetRowProbe( { presets, customTriggerLabel, onMeasure }: PresetRowProbeProps ) {
	const fullRef = useRef< HTMLDivElement >( null );
	const abbreviatedRef = useRef< HTMLDivElement >( null );

	/*
	 * Keep the last reported pair so a re-render with identical widths does not
	 * push a new object at the consumer and restart its effects.
	 */
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

	/*
	 * Measure after layout rather than on an interval or a resize: the probe is
	 * `max-content`, so its width only moves when the labels or the typography
	 * do, and both arrive as a render.
	 */
	useLayoutEffect( () => {
		measure();
	}, [ measure, presets, customTriggerLabel ] );

	/*
	 * Web fonts land after first paint and change the metrics under us. Nothing
	 * in the dashboard ships a web font today, so this is insurance rather than
	 * a fix, and it is cheap: one promise, one remeasure.
	 */
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
				{ customTriggerLabel }
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
