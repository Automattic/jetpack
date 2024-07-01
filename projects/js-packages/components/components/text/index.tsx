import clsx from 'clsx';
import React, { useMemo, forwardRef } from 'react';
import { BOX_MODEL_VALUES, VARIANTS_MAPPING } from './constants';
import styles from './style.module.scss';
import type { H3Props, TextProps, TitleProps } from './types';

/**
 * Text component.
 *
 * @param {TextProps} props - Component props.
 * @returns {React.ReactElement} - JSX.Element
 */
const Text = forwardRef< HTMLElement, TextProps >(
	( { variant = 'body', children, component, className, ...componentProps }, ref ) => {
		const Component = component || VARIANTS_MAPPING[ variant ] || 'span';

		// Build Styles module CSS classnames.
		const boxModelClasses = useMemo( () => {
			return BOX_MODEL_VALUES.reduce( ( acc, value ) => {
				if ( typeof componentProps[ value ] !== 'undefined' ) {
					acc += styles[ `${ value }-${ componentProps[ value ] }` ] + ' ';
					// pick spacing prop. Do not pass down to Component.
					delete componentProps[ value ];
				}
				return acc;
			}, '' );
		}, [ componentProps ] );

		componentProps.ref = ref;

		return (
			<Component
				className={ clsx( styles.reset, styles[ variant ], className, boxModelClasses ) }
				{ ...componentProps }
			>
				{ children }
			</Component>
		);
	}
);
Text.displayName = 'Text';

export default Text;

/**
 * Heading component - Medium size.
 *
 * @param {TextProps} props      - Component props.
 * @returns {React.ReactElement} - JSX.Element
 */
export const H2: React.FC< TextProps > = ( { children, ...componentProps } ) => (
	<Text variant="headline-medium" mb={ 3 } { ...componentProps }>
		{ children }
	</Text>
);

/**
 * Heading component - Small size,
 *
 * @param {H3Props} props        - Component props.
 * @returns {React.ReactElement} - JSX.Element
 */
export const H3: React.FC< H3Props > = ( { children, weight = 'bold', ...componentProps } ) => {
	const variant = `headline-small${
		weight === 'bold' ? '' : `-${ weight }`
	}` as TextProps[ 'variant' ];

	return (
		<Text variant={ variant } mb={ 3 } { ...componentProps }>
			{ children }
		</Text>
	);
};

/**
 * Title component, based on Text component.
 *
 * @param {TitleProps} props     - Component props.
 * @returns {React.ReactElement} - JSX.Element
 */
export const Title: React.FC< TitleProps > = ( {
	children,
	size = 'medium',
	...componentProps
} ) => (
	<Text variant={ `title-${ size }` } mb={ 1 } { ...componentProps }>
		{ children }
	</Text>
);

export * from './constants';
