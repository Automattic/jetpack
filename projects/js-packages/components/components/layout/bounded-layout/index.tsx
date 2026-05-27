import clsx from 'clsx';
import { createElement } from 'react';
import styles from './style.module.scss';
import type { FC, ReactElement, ReactNode } from 'react';

export type BoundedLayoutWidth = 'compact' | 'wide';

export type BoundedLayoutProps = {
	/**
	 * Preset max-width token. `compact` (660px) for settings-style single
	 * columns; `wide` (1344px) for dashboard grids. Mirrors MSD conventions.
	 */
	width?: BoundedLayoutWidth;

	/**
	 * Tag name for the rendered element. Defaults to `div`.
	 */
	tagName?: string;

	/**
	 * Additional className to merge onto the wrapper.
	 */
	className?: string;

	children?: ReactNode;
};

/**
 * Centers its children and caps the content area at a standardized Jetpack
 * product max-width. Use it to keep Overview / Dashboard / Settings screens
 * visually consistent across products.
 *
 * @param {BoundedLayoutProps} props - Component properties.
 * @return {ReactElement} BoundedLayout component.
 */
const BoundedLayout: FC< BoundedLayoutProps > = ( {
	width = 'wide',
	tagName = 'div',
	className,
	children,
} ) => {
	return createElement(
		tagName,
		{
			className: clsx( styles.bounds, styles[ width ], className ),
		},
		children
	);
};

export default BoundedLayout;
