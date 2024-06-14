import clsx from 'clsx';
import { createElement, useMemo } from 'react';
import { ContainerProps } from '../types';
import styles from './style.module.scss';
import type React from 'react';

/**
 * JP Container
 *
 * @param {ContainerProps} props - Component properties.
 * @returns {React.ReactElement}   Container component.
 */
const Container: React.FC< ContainerProps > = ( {
	children,
	fluid = false,
	tagName = 'div',
	className,
	horizontalGap = 1,
	horizontalSpacing = 1,
} ) => {
	const containerStyle = useMemo( () => {
		const padding = `calc( var(--horizontal-spacing) * ${ horizontalSpacing } )`;
		const rowGap = `calc( var(--horizontal-spacing) * ${ horizontalGap } )`;

		return {
			paddingTop: padding,
			paddingBottom: padding,
			rowGap,
		};
	}, [ horizontalGap, horizontalSpacing ] );

	const containerClassName = clsx( className, styles.container, {
		[ styles.fluid ]: fluid,
	} );

	return createElement(
		tagName,
		{
			className: containerClassName,
			style: containerStyle,
		},
		children
	);
};

export default Container;
