/**
 * External dependencies
 */
import { Icon, Text, VisuallyHidden } from '@wordpress/ui';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import { MetricValue } from '../metric-value';
import { MetricWithComparison } from '../metric-with-comparison';
import styles from './metric-tile-grid.module.scss';
import type { DataFormat } from '../../types';
import type { ComponentProps } from 'react';

type MetricTileGridItem = {
	/**
	 * Stable identifier for the metric tile.
	 */
	key: string;

	/**
	 * Icon shown alongside the label.
	 */
	icon?: ComponentProps< typeof Icon >[ 'icon' ];

	/**
	 * The metric label (e.g. "Posts").
	 */
	label: string;

	/**
	 * The metric value. `null` marks a metric the site doesn't have yet and
	 * renders the placeholder instead of a formatted zero; any other non-finite
	 * value (`undefined`, `NaN`) also falls back to the placeholder.
	 */
	value: number | null;

	/**
	 * The comparison-period value. Setting this — to a number or an explicit
	 * `null` — opts the tile into the comparison layout, where the value renders
	 * with a period-over-period delta. A number shows the delta; `null` renders
	 * the value alone (comparison requested but no comparable data). Leaving it
	 * `undefined` keeps the plain value layout used by non-comparison widgets.
	 */
	previousValue?: number | null;

	/**
	 * Caveat about how the value is aggregated. Shown as a hover tooltip on the
	 * tile header and mirrored as visually hidden text for assistive technology.
	 */
	note?: string;

	/**
	 * `title` tooltip on the value, e.g. the exact count behind a shortened
	 * display value (`18K` → `18,432`).
	 */
	valueTitle?: string;

	/**
	 * Format configuration for this tile's value. Falls back to the grid's
	 * `dataFormat`.
	 */
	dataFormat?: DataFormat;

	/**
	 * ISO 4217 currency code (e.g. `'USD'`), for currency formats.
	 */
	currencyCode?: string;

	/**
	 * Shown in place of the value when it is not a finite number.
	 * @default '—'
	 */
	placeholder?: string;

	/**
	 * CSS class for this tile.
	 */
	className?: string;
};

type MetricTileGridProps = {
	/**
	 * CSS class for the grid container.
	 */
	className?: string;

	/**
	 * Metric tiles to render.
	 */
	tiles: MetricTileGridItem[];

	/**
	 * Default format configuration for tile values.
	 * @default { type: 'number' }
	 */
	dataFormat?: DataFormat;

	/**
	 * Default ISO 4217 currency code (e.g. `'USD'`), for currency formats.
	 */
	currencyCode?: string;
};

/**
 * The value cell for a single tile. A non-finite value renders the placeholder;
 * a tile that opts into comparison (its `previousValue` is set) renders through
 * `MetricWithComparison`; otherwise it renders a plain formatted value.
 *
 * @param props              - The component props.
 * @param props.tile         - The tile to render the value for.
 * @param props.dataFormat   - The grid's default value format.
 * @param props.currencyCode - The grid's default currency code.
 * @return The rendered value cell.
 */
function MetricTileValue( {
	tile,
	dataFormat,
	currencyCode,
}: {
	tile: MetricTileGridItem;
	dataFormat: DataFormat;
	currencyCode?: string;
} ) {
	if ( ! Number.isFinite( tile.value ) ) {
		return <Text className={ styles.placeholder }>{ tile.placeholder ?? '—' }</Text>;
	}

	if ( tile.previousValue !== undefined ) {
		return (
			<span className={ styles.comparison } title={ tile.valueTitle }>
				<MetricWithComparison
					value={ tile.value as number }
					previousValue={ tile.previousValue }
					dataFormat={ tile.dataFormat ?? dataFormat }
				/>
			</span>
		);
	}

	return (
		<MetricValue
			value={ tile.value as number }
			dataFormat={ tile.dataFormat ?? dataFormat }
			currencyCode={ tile.currencyCode ?? currencyCode }
			className={ styles.value }
			title={ tile.valueTitle }
		/>
	);
}

/**
 * Responsive container for metric tiles. The layout tracks the widget cell size
 * and picks one of three shapes on its own, no column count needed:
 *
 * - narrow: a single column of compact rows (icon and label left, value right);
 * - wide but short: a single row of centered tiles (columns follow tile count);
 * - wide and tall: a balanced two-column grid of large centered tiles.
 *
 * The grid is a size container, so it takes no height of its own: render it
 * inside a definite-height flex column (or a `height: 100%` chain) or it
 * collapses to 0x0.
 *
 * @param {MetricTileGridProps} props - The component props.
 * @return The rendered grid.
 */
export function MetricTileGrid( {
	className,
	tiles,
	dataFormat = { type: 'number' },
	currencyCode,
}: MetricTileGridProps ) {
	return (
		<div className={ clsx( styles.container, className ) }>
			<div className={ styles.grid } role="list">
				{ tiles.map( tile => (
					<div key={ tile.key } className={ clsx( styles.tile, tile.className ) } role="listitem">
						<div className={ styles.header } title={ tile.note }>
							{ tile.icon && <Icon icon={ tile.icon } size={ 24 } className={ styles.icon } /> }
							<Text className={ styles.label }>{ tile.label }</Text>
							{ /* The `title` tooltip is invisible to keyboard and screen-reader
							     users, so the caveat is repeated as visually hidden text. */ }
							{ tile.note && <VisuallyHidden>{ tile.note }</VisuallyHidden> }
						</div>
						<MetricTileValue
							tile={ tile }
							dataFormat={ dataFormat }
							currencyCode={ currencyCode }
						/>
					</div>
				) ) }
			</div>
		</div>
	);
}
