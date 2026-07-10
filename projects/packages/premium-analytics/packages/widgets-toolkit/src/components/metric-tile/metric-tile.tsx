/**
 * External dependencies
 */
import { Icon, Text } from '@wordpress/ui';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import { MetricValue } from '../metric-value';
import styles from './metric-tile.module.scss';
import type { DataFormat } from '../../types';
import type { ComponentProps, CSSProperties, ReactNode } from 'react';

export type MetricTileGridProps = {
	/**
	 * Column count for the wide (tile) layout. Narrow widths always render one
	 * tile per row.
	 * @default 2
	 */
	columns?: number;

	/**
	 * CSS class for the grid container.
	 */
	className?: string;

	/**
	 * The `MetricTile` children.
	 */
	children: ReactNode;
};

/**
 * Responsive container for `MetricTile`s. Establishes its own container query
 * context, so the layout tracks the widget's rendered width rather than the
 * viewport: narrow widths stack compact label/value rows, wide widths lay the
 * tiles out `columns` across with centered content.
 *
 * @param {MetricTileGridProps} props - The component props.
 * @return The rendered grid.
 */
export function MetricTileGrid( { columns = 2, className, children }: MetricTileGridProps ) {
	// The query container must be an ancestor of the queried elements, so the
	// grid styles live on an inner element.
	return (
		<div className={ clsx( styles.container, className ) }>
			<div
				className={ styles.grid }
				style={ { '--jpa-metric-tile-grid-columns': columns } as CSSProperties }
			>
				{ children }
			</div>
		</div>
	);
}

export type MetricTileProps = {
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
	 * Format configuration for the value.
	 * @default { type: 'number' }
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
	 * CSS class for the tile.
	 */
	className?: string;
};

/**
 * A single metric tile: an icon + label header and a formatted value. Inside a
 * `MetricTileGrid` it renders as a compact row (label left, value right) at
 * narrow widths and as a large centered tile at wide widths.
 *
 * The modules these tiles show have no comparison period, so the value renders
 * through `MetricValue` with no delta.
 *
 * @param {MetricTileProps} props - The component props.
 * @return The rendered tile.
 */
export function MetricTile( {
	icon,
	label,
	value,
	dataFormat = { type: 'number' },
	currencyCode,
	placeholder = '—',
	className,
}: MetricTileProps ) {
	return (
		<div className={ clsx( styles.tile, className ) }>
			<div className={ styles.header }>
				{ icon && <Icon icon={ icon } size={ 24 } className={ styles.icon } /> }
				<Text className={ styles.label }>{ label }</Text>
			</div>
			{ value === null ? (
				<Text className={ styles.placeholder }>{ placeholder }</Text>
			) : (
				<MetricValue
					value={ value }
					dataFormat={ dataFormat }
					currencyCode={ currencyCode }
					fontSize="xl"
					className={ styles.value }
				/>
			) }
		</div>
	);
}
