import { Button as WPButton, Spinner, VisuallyHidden } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, external } from '@wordpress/icons';
import clsx from 'clsx';
import { forwardRef } from 'react';
import styles from './style.module.scss';
import type { ButtonProps } from './types.ts';

/**
 * Button component
 *
 * @param {ButtonProps} props - Component Props
 * @return {ReactNode} Rendered button
 */
const Button = forwardRef< HTMLElement, ButtonProps >( ( props, ref ) => {
	const {
		children,
		variant = 'primary',
		size = 'normal',
		weight = 'bold',
		icon,
		iconSize,
		disabled,
		isDestructive,
		isLoading,
		isExternalLink,
		className: propsClassName,
		text,
		fullWidth,
		...componentProps
	} = props;

	const className = clsx( styles.button, propsClassName, {
		[ styles.normal ]: size === 'normal',
		[ styles.small ]: size === 'small',
		[ styles.icon ]: Boolean( icon ),
		[ styles.loading ]: isLoading,
		[ styles.regular ]: weight === 'regular',
		[ styles[ 'full-width' ] ]: fullWidth,
		[ styles[ 'is-icon-button' ] ]: Boolean( icon ) && ! children,
	} );

	const externalIconSize = size === 'normal' ? 20 : 16;
	const externalIcon = isExternalLink && (
		<>
			<Icon size={ externalIconSize } icon={ external } className={ styles[ 'external-icon' ] } />
			<VisuallyHidden as="span">
				{
					/* translators: accessibility text */
					__( '(opens in a new tab)', 'jetpack-components' )
				}
			</VisuallyHidden>
		</>
	);
	const externalTarget = isExternalLink ? '_blank' : undefined;

	// ref https://github.com/WordPress/gutenberg/pull/44198
	const hasChildren =
		children?.[ 0 ] &&
		children[ 0 ] !== null &&
		// Tooltip should not considered as a child
		children?.[ 0 ]?.props?.className !== 'components-tooltip';

	// Cast to work around WPButton's strict union type that can't be satisfied when spreading props
	const wpButtonProps = {
		ref,
		target: externalTarget,
		variant,
		className: clsx( className, { 'has-text': !! icon && hasChildren } ),
		icon: ! isExternalLink ? icon : undefined,
		iconSize,
		disabled,
		'aria-disabled': disabled,
		isDestructive,
		text,
		...componentProps,
	} as React.ComponentProps< typeof WPButton >;

	return (
		<WPButton { ...wpButtonProps }>
			{ isLoading && <Spinner /> }
			<span>{ children }</span>
			{ externalIcon }
		</WPButton>
	);
} );
Button.displayName = 'Button';

export default Button;
