/**
 * External dependencies
 */
import { Icon, Text } from '@wordpress/ui';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import { MetricValue } from '../metric-value';
import styles from './metric-tile-grid.module.scss';
import type { DataFormat } from '../../types';
import type { ComponentProps } from 'react';

export type MetricTileGridItem = {
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

export type MetricTileGridProps = {
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
						<div className={ styles.header }>
							{ tile.icon && <Icon icon={ tile.icon } size={ 24 } className={ styles.icon } /> }
							<Text className={ styles.label }>{ tile.label }</Text>
						</div>
						{ Number.isFinite( tile.value ) ? (
							<MetricValue
								value={ tile.value as number }
								dataFormat={ tile.dataFormat ?? dataFormat }
								currencyCode={ tile.currencyCode ?? currencyCode }
								className={ styles.value }
							/>
						) : (
							<Text className={ styles.placeholder }>{ tile.placeholder ?? '—' }</Text>
						) }
					</div>
				) ) }
			</div>
		</div>
	);
}
