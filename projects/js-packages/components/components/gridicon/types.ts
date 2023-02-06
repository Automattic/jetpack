import type { CSSProperties } from 'react';

export type GridiconProps = {
	/**
	 * Icon name
	 */
	icon: string;

	/**
	 * HTML class name
	 */
	className?: string;

	/**
	 * Description for SVG for screen readers
	 */
	description?: string;

	/**
	 * Whether SVG is focussable
	 */
	focusable?: boolean;

	/**
	 * SVG height
	 */
	height?: number;

	/**
	 * Click handler
	 */
	onClick?: VoidFunction;

	/**
	 * SVG width and height
	 */
	size?: number;

	/**
	 * SVG style
	 */
	style?: CSSProperties;

	/**
	 * SVG width
	 */
	width?: number;
};
