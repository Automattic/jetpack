import styles from './base-tooltip.module.scss';
import type { CSSProperties, ComponentType } from 'react';

type TooltipData = {
	label: string;
	value: number;
	valueDisplay?: string;
};

type TooltipComponentProps = {
	data: TooltipData;
	className?: string;
};

type BaseTooltipProps = {
	data: TooltipData;
	top: number;
	left: number;
	style?: CSSProperties;
	component?: ComponentType< TooltipComponentProps >;
	className?: string;
};

const DefaultTooltipContent = ( { data }: TooltipComponentProps ) => (
	<>
		{ data.label }: { data.valueDisplay || data.value }
	</>
);

export const BaseTooltip = ( {
	data,
	top,
	left,
	component: Component = DefaultTooltipContent,
	className,
}: BaseTooltipProps ) => {
	return (
		<div className={ styles.tooltip } style={ { top, left } } role="tooltip">
			<Component data={ data } className={ className } />
		</div>
	);
};

export type { BaseTooltipProps, TooltipData };
