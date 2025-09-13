import type { ReactNode } from 'react';

export type BaseIconProps = {
	/**
	 * Icon size.
	 */
	size?: number;

	/**
	 * Opacity for SVG shapes
	 */
	opacity?: number;

	/**
	 * Icon viewBox.
	 */
	viewBox?: string;

	/**
	 * Icon component children.
	 */
	children?: ReactNode;

	/**
	 * Icon class name. Optional.
	 */
	className?: string;

	/**
	 * RGB Icon color. Optional.
	 */
	color?: string;
};
