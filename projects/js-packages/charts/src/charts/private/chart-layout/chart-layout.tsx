import { Stack } from '@wordpress/ui';
import { forwardRef } from 'react';
import { useElementSize } from '../../../hooks';
import { renderLegendSlot } from '../chart-composition';
import styles from './chart-layout.module.scss';
import type { LegendPosition } from '../../../types';
import type { LegendChild } from '../chart-composition/use-chart-children';
import type { GapSize } from '@wordpress/theme';
import type { CSSProperties, ReactNode } from 'react';

/**
 * Measurements provided to the render prop when ChartLayout handles resize listening.
 */
export interface ContentMeasurements {
	/** Measured width of the content area in pixels */
	contentWidth: number;
	/** Measured height of the content area in pixels */
	contentHeight: number;
	/** True once the content area has been measured. Always true when waitForMeasurement is not set. */
	isMeasured: boolean;
}

export interface ChartLayoutProps {
	/** Position for the prop-based legend element */
	legendPosition: LegendPosition;
	/** The legend element rendered via the showLegend prop (false when hidden) */
	legendElement?: ReactNode;
	/** Legend children from the composition API */
	legendChildren: LegendChild[];
	/** Chart content — either a ReactNode or a render prop receiving content measurements */
	children: ReactNode | ( ( measurements: ContentMeasurements ) => ReactNode );
	/** Content rendered after the bottom legend (e.g., nonLegendChildren, htmlChildren, tooltips) */
	trailingContent?: ReactNode;
	/** When true, hides the layout until content measurement is available */
	waitForMeasurement?: boolean;
	/** @deprecated Use waitForMeasurement instead */
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
			waitForMeasurement,
			isWaitingForMeasurement,
			gap,
			className,
			style,
			'data-testid': dataTestId,
			'data-chart-id': dataChartId,
		},
		ref
	) => {
		const [ contentRef, contentWidth, contentHeight ] = useElementSize< HTMLDivElement >();
		const isMeasured = contentHeight > 0;

		// Determine visibility: new waitForMeasurement prop takes precedence over legacy isWaitingForMeasurement
		let visibilityStyle: { visibility?: 'hidden' | 'visible' } = {};
		if ( waitForMeasurement !== undefined ) {
			// New API: hide until measured
			const isHidden = waitForMeasurement && ! isMeasured;
			visibilityStyle = { visibility: isHidden ? 'hidden' : 'visible' };
		} else if ( isWaitingForMeasurement !== undefined ) {
			// Legacy API
			visibilityStyle = {
				visibility: isWaitingForMeasurement ? 'hidden' : 'visible',
			};
		}

		const isRenderProp = typeof children === 'function';
		const renderedChildren = isRenderProp
			? children( { contentWidth, contentHeight, isMeasured } )
			: children;

		return (
			<Stack
				ref={ ref }
				direction="column"
				gap={ gap }
				className={ className }
				style={ { ...style, ...visibilityStyle } }
				data-testid={ dataTestId }
				data-chart-id={ dataChartId }
			>
				{ legendPosition === 'top' && legendElement }
				{ renderLegendSlot( legendChildren, 'top' ) }

				{ isRenderProp ? (
					<div ref={ contentRef } className={ styles[ 'chart-layout__content' ] }>
						{ renderedChildren }
					</div>
				) : (
					renderedChildren
				) }

				{ legendPosition === 'bottom' && legendElement }
				{ renderLegendSlot( legendChildren, 'bottom' ) }

				{ trailingContent }
			</Stack>
		);
	}
);

ChartLayout.displayName = 'ChartLayout';
