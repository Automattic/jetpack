import { LabelValueContent } from './private/label-value-content';
import { TooltipBox } from './tooltip-box';
import type { TooltipData } from './types';
import type { CSSProperties, ComponentType, ReactNode } from 'react';

type TooltipComponentProps = {
	data: TooltipData;
	className?: string;
};

type TooltipCommonProps = {
	/** @deprecated Position the box with `style`, or use `TooltipBox`. */
	top?: number;
	/** @deprecated Position the box with `style`, or use `TooltipBox`. */
	left?: number;
	style?: CSSProperties;
	className?: string;
	/**
	 * Whether to render the tooltip container div. When false, only renders the content.
	 * @deprecated Render the content directly; `TooltipBox` draws the box.
	 * @default true
	 */
	renderContainer?: boolean;
};

type DefaultDataTooltip = {
	/** @deprecated Pass the content as children, or use `TooltipBox`. */
	data: TooltipData;
	/** @deprecated Pass the content as children, or use `TooltipBox`. */
	component?: ComponentType< TooltipComponentProps >;
	children?: never;
};

type CustomTooltip = {
	children: ReactNode;
	data?: never;
	component?: never;
};

type BaseTooltipProps = TooltipCommonProps & ( DefaultDataTooltip | CustomTooltip );

/**
 * A tooltip box with children or `label: value` content. Prefer `TooltipBox`.
 *
 * @param props                 - Tooltip props.
 * @param props.data            - Data for the default content.
 * @param props.top             - Deprecated vertical position.
 * @param props.left            - Deprecated horizontal position.
 * @param props.component       - Deprecated content component.
 * @param props.children        - Tooltip content.
 * @param props.className       - Class name passed to the content component.
 * @param props.style           - Styles for the box.
 * @param props.renderContainer - Deprecated; render the content alone when false.
 * @return The tooltip.
 */
export const BaseTooltip = ( {
	data,
	top,
	left,
	component: Component = LabelValueContent,
	children,
	className,
	style,
	renderContainer = true,
}: BaseTooltipProps ) => {
	const content = children || ( data && <Component data={ data } className={ className } /> );

	if ( ! renderContainer ) {
		return content;
	}

	const placement =
		top === undefined && left === undefined
			? undefined
			: ( { position: 'absolute', top, left, transform: 'translate(-50%, -100%)' } as const );

	return <TooltipBox style={ { ...placement, ...style } }>{ content }</TooltipBox>;
};

export type { BaseTooltipProps, TooltipData };
