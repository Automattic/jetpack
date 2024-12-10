import styles from './base-tooltip.module.scss';
import type { TooltipProps } from './types';
import type { CSSProperties, ComponentType } from 'react';

interface TooltipComponentProps {
	data: TooltipProps[ 'data' ];
	className?: string;
}

const DefaultTooltipContent = ( { data }: TooltipComponentProps ) => (
	<>
		{ data.label }: { data.value }
	</>
);

type BaseTooltipProps = {
	data: TooltipProps[ 'data' ];
	top: number;
	left: number;
	style?: CSSProperties;
	component?: ComponentType< TooltipComponentProps >;
	className?: string;
};

export const BaseTooltip = ( {
	data,
	top,
	left,
	style = {},
	component: Component = DefaultTooltipContent,
	className,
}: BaseTooltipProps ) => {
	return (
		<div
			className={ styles.tooltip }
			style={ {
				top,
				left,
				...style,
			} }
			role="tooltip"
		>
			<Component data={ data } className={ className } />
		</div>
	);
};

export type { BaseTooltipProps };
