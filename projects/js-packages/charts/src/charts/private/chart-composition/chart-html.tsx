import type { FC, PropsWithChildren } from 'react';

/**
 * Compound component for HTML children in charts.
 * This component serves as a marker for HTML content that should be rendered
 * outside the chart's SVG element. The actual rendering is handled by the parent chart.
 *
 * @param {PropsWithChildren} props          - Component props
 * @param {ReactNode}         props.children - Child elements to render outside the SVG
 * @return {JSX.Element} The children wrapped in a fragment
 */
export const ChartHTML: FC< PropsWithChildren > = ( { children } ) => {
	// This component doesn't render directly - its children are extracted by the parent chart
	// We just return the children as-is
	return <>{ children }</>;
};

// Set displayName for better debugging and type checking
ChartHTML.displayName = 'Chart.HTML';
