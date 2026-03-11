import { Stack } from '@wordpress/ui';
import clsx from 'clsx';
import { forwardRef } from 'react';
import { renderLegendSlot } from '../../charts/private/chart-composition';
import styles from './chart-layout.module.scss';
import type { LegendChild } from '../../charts/private/chart-composition/use-chart-children';
import type { LegendPosition } from '../../types';
import type { GapSize } from '@wordpress/theme';
import type { CSSProperties, ReactNode } from 'react';

interface ChartLayoutProps {
	/** Position for the prop-based legend element */
	legendPosition: LegendPosition;
	/** The legend element rendered via the showLegend prop (false when hidden) */
	legendElement?: ReactNode;
	/** Legend children from the composition API */
	legendChildren: LegendChild[];
	/** Chart content rendered between legend slots */
	children: ReactNode;
	/** Content rendered after the bottom legend (e.g., nonLegendChildren, htmlChildren, tooltips) */
	trailingContent?: ReactNode;
	/** When true, sets visibility: hidden on the container. Used by charts that need measurement before rendering. */
	isWaitingForMeasurement?: boolean;
	/** Gap between Stack items */
	gap?: GapSize;
	/** Additional class names */
	className?: string;
	/** Inline styles (width, height, etc.) */
	style?: CSSProperties;
	/** Test ID for the container */
	'data-testid'?: string;
	/** Chart ID attribute */
	'data-chart-id'?: string;
}

export const ChartLayout = forwardRef< HTMLDivElement, ChartLayoutProps >(
	(
		{
			legendPosition,
			legendElement,
			legendChildren,
			children,
			trailingContent,
			isWaitingForMeasurement,
			gap,
			className,
			style,
			'data-testid': dataTestId,
			'data-chart-id': dataChartId,
		},
		ref
	) => {
		const visibilityStyle =
			isWaitingForMeasurement !== undefined
				? { visibility: ( isWaitingForMeasurement ? 'hidden' : 'visible' ) as const }
				: {};

		return (
			<Stack
				ref={ ref }
				direction="column"
				gap={ gap }
				className={ clsx( styles[ 'chart-layout' ], className ) }
				style={ { ...style, ...visibilityStyle } }
				data-testid={ dataTestId }
				data-chart-id={ dataChartId }
			>
				{ legendPosition === 'top' && legendElement }
				{ renderLegendSlot( legendChildren, 'top' ) }

				{ children }

				{ legendPosition === 'bottom' && legendElement }
				{ renderLegendSlot( legendChildren, 'bottom' ) }

				{ trailingContent }
			</Stack>
		);
	}
);

ChartLayout.displayName = 'ChartLayout';
