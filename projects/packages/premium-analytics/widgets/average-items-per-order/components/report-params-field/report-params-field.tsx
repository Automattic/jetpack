/**
 * External dependencies
 */
import {
	getDefaultQueryParams,
	hasComparisonEnabled,
	type ReportParams,
} from '@jetpack-premium-analytics/data';
import { isSelectablePreset, PRESET_DEFINITIONS } from '@jetpack-premium-analytics/datetime';
import { useCallback, useId, type CSSProperties } from 'react';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import type { DataFormControlProps } from '@wordpress/dataviews';

/*
 * DEMO / WORKAROUND — a range editor that lives inside the widget's
 * *metadata* module graph (widget.ts → Edit component → here).
 *
 * The constraint this file works around: wp-build's widget metadata build
 * has NO style plugins (only the render build gets
 * `createStyleBundlingPlugins()`), so nothing in this import graph may
 * touch a `.scss`/`.module.scss` file. That rules out the toolkit's
 * `ReportParamsField` (its `DateFiltersPanel` from the ui package carries
 * CSS modules throughout) — and any other styled component library route.
 *
 * What's left is what you see: plain HTML elements with inline styles,
 * and preset-only ranges (no calendar, so no custom from/to). The data
 * wiring is identical to the real field — `onChange( { reportParams } )`
 * with params built by `getDefaultQueryParams( comparison, preset )` —
 * which is exactly why the long-term fix is moving the field
 * implementation host-side (or adding style support to the metadata
 * build), not hand-rolling editors like this per widget.
 */

type ReportParamsFieldAttributes = {
	reportParams: ReportParams;
};

const DEFAULT_PRESET = 'last-30-days';

const rowStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: '8px',
};

const labelStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: '4px',
	font: 'inherit',
};

const checkboxRowStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: '8px',
};

const selectStyle: CSSProperties = {
	font: 'inherit',
	padding: '6px 8px',
};

export function ReportParamsField( {
	data: attributes,
	onChange,
}: DataFormControlProps< ReportParamsFieldAttributes > ) {
	const reportParams = attributes?.reportParams;

	const preset =
		reportParams?.preset && isSelectablePreset( reportParams.preset )
			? reportParams.preset
			: DEFAULT_PRESET;
	const comparison = reportParams ? hasComparisonEnabled( reportParams ) : true;

	const commit = useCallback(
		( nextPreset: string, nextComparison: boolean ) => {
			// `isSelectablePreset` already excludes 'custom' — preset-only
			// ranges are all this style-free editor can offer (no calendar).
			if ( ! isSelectablePreset( nextPreset ) ) {
				return;
			}
			onChange( {
				reportParams: getDefaultQueryParams( nextComparison, nextPreset ),
			} );
		},
		[ onChange ]
	);

	const handlePresetChange = useCallback(
		( event: React.ChangeEvent< HTMLSelectElement > ) => commit( event.target.value, comparison ),
		[ commit, comparison ]
	);

	const handleComparisonChange = useCallback(
		( event: React.ChangeEvent< HTMLInputElement > ) => commit( preset, event.target.checked ),
		[ commit, preset ]
	);

	const presetSelectId = useId();
	const comparisonCheckboxId = useId();

	return (
		<div style={ rowStyle }>
			<label style={ labelStyle } htmlFor={ presetSelectId }>
				{ __( 'Date range', 'jetpack-premium-analytics' ) }
				<select
					id={ presetSelectId }
					style={ selectStyle }
					value={ preset }
					onChange={ handlePresetChange }
				>
					{ PRESET_DEFINITIONS.map( definition => (
						<option key={ definition.id } value={ definition.id }>
							{ definition.getLabel() }
						</option>
					) ) }
				</select>
			</label>
			<label style={ checkboxRowStyle } htmlFor={ comparisonCheckboxId }>
				<input
					id={ comparisonCheckboxId }
					type="checkbox"
					checked={ comparison }
					onChange={ handleComparisonChange }
				/>
				{ __( 'Compare to previous period', 'jetpack-premium-analytics' ) }
			</label>
		</div>
	);
}
