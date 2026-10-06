import { formatNumber } from '@automattic/number-formatters';
import clsx from 'clsx';
import { CHART_SCOPE_CLASS } from '../../styles/chart-scope-class';
import styles from './base-tooltip.module.scss';
import { TooltipTheme } from './private/tooltip-theme';
import type { CSSProperties, ComponentType, ReactNode } from 'react';

type TooltipData = {
	label: string;
	value: number;
	valueDisplay?: string;
};

type TooltipComponentProps = {
	data: TooltipData;
	className?: string;
};

type TooltipCommonProps = {
	top: number;
	left: number;
	style?: CSSProperties;
	className?: string;
	/**
	 * Whether to render the tooltip container div. When false, only renders the content.
	 * Useful when the tooltip is rendered inside a portal or custom container.
	 * @default true
	 */
	renderContainer?: boolean;
};

type DefaultDataTooltip = {
	data: TooltipData;
	component?: ComponentType< TooltipComponentProps >;
	children?: never;
};

type CustomTooltip = {
	children: ReactNode;
	data?: never;
	component?: never;
};

type BaseTooltipProps = TooltipCommonProps & ( DefaultDataTooltip | CustomTooltip );

const DefaultTooltipContent = ( { data }: TooltipComponentProps ) => (
	<>
		{ data?.label }: { data?.valueDisplay || formatNumber( data?.value ) }
	</>
);

export const BaseTooltip = ( {
	data,
	top,
	left,
	component: Component = DefaultTooltipContent,
	children,
	className,
	style,
	renderContainer = true,
}: BaseTooltipProps ) => {
	const content = children || ( data && <Component data={ data } className={ className } /> );

	if ( ! renderContainer ) {
		return content;
	}

	return (
		<TooltipTheme>
			<div
				className={ clsx( CHART_SCOPE_CLASS, styles.tooltip ) }
				style={ { top, left, ...style } }
				role="tooltip"
			>
				{ content }
			</div>
		</TooltipTheme>
	);
};

export type { BaseTooltipProps, TooltipData };
