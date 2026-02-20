/**
 * External dependencies
 */
import clsx from 'clsx';
// eslint-disable-next-line import/default
import React, { type CSSProperties, forwardRef } from 'react';

export interface StackProps extends React.HTMLAttributes< HTMLElement > {
	direction?: 'row' | 'column';
	gap?: number | CSSProperties[ 'gap' ];
	align?: CSSProperties[ 'alignItems' ];
	justify?: CSSProperties[ 'justifyContent' ];
	wrap?: 'wrap' | 'nowrap';
	render?: React.ReactElement;
	as?: React.ElementType;
}

/**
 * Normalizes the gap value. When given a positive number, it will be converted
 * to a CSS calculation. When given a string, it will be returned as is.
 *
 * @param gap - The gap value to normalize.
 *
 * @return The normalized gap value.
 */
export const getNormalizedGap = ( gap: number | CSSProperties[ 'gap' ] ) =>
	typeof gap === 'number' ? `calc( ${ gap } * var( --wpds-spacing-05 ) )` : gap;

/**
 * A flexible layout component using CSS Flexbox for consistent spacing and alignment.
 * Built on design tokens for predictable spacing values.
 */
export const Stack = forwardRef< HTMLElement, StackProps >( function Stack(
	{
		direction,
		gap = 'initial',
		align = 'initial',
		justify = 'initial',
		wrap,
		render,
		as: Component = 'div',
		className,
		style: propStyle,
		...props
	},
	ref
) {
	const classes = clsx(
		'jp-forms-stack',
		{
			'jp-forms-stack--column': direction === 'column',
			'jp-forms-stack--wrap': wrap === 'wrap',
		},
		className
	);

	const style: CSSProperties = {
		...propStyle,
		'--wp-ui-stack-gap': getNormalizedGap( gap ),
		'--wp-ui-stack-align': align,
		'--wp-ui-stack-justify': justify,
	} as CSSProperties;

	// If render prop is provided, clone it with merged props
	if ( render ) {
		return React.cloneElement( render, {
			...props,
			ref,
			className: clsx( render.props.className, classes ),
			style: { ...render.props.style, ...style },
		} );
	}

	return <Component ref={ ref } style={ style } className={ classes } { ...props } />;
} );
