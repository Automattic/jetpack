import type { TooltipProps } from './types';
import type { ReactNode, CSSProperties, ComponentType } from 'react';

const defaultTooltipStyles = {
	padding: '0.5rem',
	backgroundColor: 'rgba(0,0,0,0.85)',
	color: 'white',
	borderRadius: '4px',
	fontSize: '14px',
	boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
};

interface TooltipComponentProps {
	data: TooltipProps[ 'data' ];
	className?: string;
}

const DefaultTooltipContent = ( { data }: TooltipComponentProps ) => (
	<>
		{ data.label }: { data.value }
	</>
);

interface ExtendedTooltipProps {
	top: number;
	left: number;
	style?: CSSProperties;
	data: TooltipProps[ 'data' ];
	component?: ComponentType< TooltipComponentProps >;
	children?: ReactNode;
	className?: string;
}

/**
 * Tooltip component that can be customized with different content components
 * @param {object}                               props           - Component properties
 * @param {TooltipProps['data']}                 props.data      - Data to be displayed in the tooltip
 * @param {number}                               props.top       - Distance from top of container in pixels
 * @param {number}                               props.left      - Distance from left of container in pixels
 * @param {CSSProperties}                        props.style     - Additional CSS styles to apply to tooltip
 * @param {ComponentType<TooltipComponentProps>} props.component - Custom component to render tooltip content
 * @param {string}                               props.className - Additional CSS class names
 * @return {JSX.Element}                                          Rendered tooltip component
 */
export const Tooltip = ( {
	data,
	top,
	left,
	style = {},
	component: Component = DefaultTooltipContent,
	className,
}: ExtendedTooltipProps ) => {
	return (
		<div
			style={ {
				position: 'absolute',
				top,
				left,
				...defaultTooltipStyles,
				...style,
			} }
			className={ className }
			role="tooltip"
		>
			<Component data={ data } />
		</div>
	);
};
