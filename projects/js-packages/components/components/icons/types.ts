import type React from 'react';

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
	children?: React.ReactNode;

	/**
	 * Icon class name. Optional.
	 */
	className?: string;

	/**
	 * RGB Icon color. Optional.
	 */
	color?: string;
};
