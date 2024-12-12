import { LegendOrdinal } from '@visx/legend';
import { scaleOrdinal } from '@visx/scale';
import clsx from 'clsx';
import { FC, useCallback } from 'react';
import styles from './legend.module.scss';
import type { LegendProps } from './types';

/**
 * Base legend component that displays color-coded items with labels using visx
 * @param {object} props             - Component properties
 * @param {Array}  props.items       - Array of legend items to display
 * @param {string} props.className   - Additional CSS class names
 * @param {string} props.orientation - Layout orientation (horizontal/vertical)
 * @return {JSX.Element}               Rendered legend component
 */
const orientationToFlexDirection = {
	horizontal: 'row' as const,
	vertical: 'column' as const,
};

export const BaseLegend: FC< LegendProps > = ( {
	items,
	className,
	orientation = 'horizontal',
} ) => {
	const legendScale = scaleOrdinal( {
		domain: items.map( item => item.label ),
		range: items.map( item => item.color ),
	} );

	const handleLabelFormat = useCallback(
		( label: string ) => {
			const item = items.find( i => i.label === label );
			return `${ label }${ item?.value ? ` ${ item.value }` : '' }`;
		},
		[ items ]
	);

	return (
		<div
			className={ clsx( styles.legend, styles[ `legend--${ orientation }` ], className ) }
			role="list"
		>
			<LegendOrdinal
				scale={ legendScale }
				direction={ orientationToFlexDirection[ orientation ] }
				shape="rect"
				shapeWidth={ 16 }
				shapeHeight={ 16 }
				className={ clsx(
					styles[ 'legend-items' ],
					styles[ 'legend-item' ],
					styles[ 'legend-item-swatch' ],
					styles[ 'legend-item-label' ]
				) }
				labelFormat={ handleLabelFormat }
			/>
		</div>
	);
};
