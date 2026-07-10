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
import type { ComponentProps, CSSProperties } from 'react';

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
	 * renders the placeholder instead of a formatted zero.
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
	 * Shown in place of the value when it is `null`.
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
	 * Maximum column count for the wide (tile) layout. Narrow widths always
	 * render one tile per row.
	 * @default 2
	 */
	columns?: number;

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
 * Responsive container for metric tiles. The layout tracks the widget cell:
 * compact rows for narrow or short cells, centered tiles when the cell has
 * enough width and height for them.
 *
 * @param {MetricTileGridProps} props - The component props.
 * @return The rendered grid.
 */
export function MetricTileGrid( {
	columns = 2,
	className,
	tiles,
	dataFormat = { type: 'number' },
	currencyCode,
}: MetricTileGridProps ) {
	const tileCount = tiles.length;
	const maxColumns = Math.max( 1, columns );
	const activeColumns = Math.max( 1, Math.min( maxColumns, tileCount || maxColumns ) );

	const style = {
		'--jpa-metric-tile-grid-columns': activeColumns,
	} as CSSProperties;

	return (
		<div className={ clsx( styles.container, className ) } style={ style }>
			<div className={ styles.grid } role="list">
				{ tiles.map( tile => (
					<div key={ tile.key } className={ clsx( styles.tile, tile.className ) } role="listitem">
						<div className={ styles.header }>
							{ tile.icon && <Icon icon={ tile.icon } size={ 24 } className={ styles.icon } /> }
							<Text className={ styles.label }>{ tile.label }</Text>
						</div>
						{ tile.value === null ? (
							<Text className={ styles.placeholder }>{ tile.placeholder ?? '—' }</Text>
						) : (
							<MetricValue
								value={ tile.value }
								dataFormat={ tile.dataFormat ?? dataFormat }
								currencyCode={ tile.currencyCode ?? currencyCode }
								fontSize="xl"
								className={ styles.value }
							/>
						) }
					</div>
				) ) }
			</div>
		</div>
	);
}
