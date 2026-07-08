import { Stack } from '@wordpress/ui';
import { useEffect } from 'react';
import { useElementSize } from '../../../hooks';
import { renderLegendSlot } from '../chart-composition';
import styles from './chart-layout.module.scss';
import type { GapSize, LegendPosition } from '../../../types';
import type { LegendChild } from '../chart-composition/use-chart-children';
import type { CSSProperties, ReactNode } from 'react';

/**
 * Measurements provided to the render prop when ChartLayout handles resize listening.
 */
export interface ContentMeasurements {
	/** Measured width of the content area in pixels */
	contentWidth: number;
	/** Measured height of the content area in pixels */
	contentHeight: number;
	/** True when a non-zero contentHeight measurement is available */
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
	/** Called when the measured content height changes (for render-prop mode) */
	onContentHeightChange?: ( height: number ) => void;
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

export const ChartLayout = ( {
	legendPosition,
	legendElement,
	legendChildren,
	children,
	trailingContent,
	onContentHeightChange,
	gap,
	className,
	style,
	'data-testid': dataTestId,
	'data-chart-id': dataChartId,
}: ChartLayoutProps ) => {
	const [ contentRef, contentWidth, contentHeight ] = useElementSize< HTMLDivElement >();
	const isRenderProp = typeof children === 'function';
	const isMeasured = contentHeight > 0;

	// When using render-prop children, hide the layout until measurement is available
	// to prevent layout shift. Plain ReactNode children don't need this since they
	// don't depend on measured dimensions.
	const visibilityStyle: { visibility?: 'hidden' | 'visible' } =
		isRenderProp && ! isMeasured ? { visibility: 'hidden' } : {};

	useEffect( () => {
		if ( isRenderProp && onContentHeightChange && isMeasured ) {
			onContentHeightChange( contentHeight );
		}
	}, [ isRenderProp, contentHeight, isMeasured, onContentHeightChange ] );
	const renderedChildren = isRenderProp
		? children( { contentWidth, contentHeight, isMeasured } )
		: children;

	return (
		<Stack
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
};
