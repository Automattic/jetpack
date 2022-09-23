/**
 * External dependencies
 */
import { Button as WPButton, Spinner } from '@wordpress/components';
import { Icon, external } from '@wordpress/icons';
import classNames from 'classnames';
import React, { forwardRef } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import type { ButtonProps } from './types';

/**
 * Button component
 *
 * @param {ButtonProps} props - Component Props
 * @returns {React.ReactNode} Rendered button
 */
const Button = forwardRef< HTMLInputElement, ButtonProps >( ( props, ref ) => {
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

	const className = classNames( styles.button, propsClassName, {
		[ styles.normal ]: size === 'normal',
		[ styles.small ]: size === 'small',
		[ styles.icon ]: Boolean( icon ),
		[ styles.loading ]: isLoading,
		[ styles.regular ]: weight === 'regular',
		[ styles[ 'full-width' ] ]: fullWidth,
		[ styles[ 'is-icon-button' ] ]: Boolean( icon ) && ! children,
	} );

	componentProps.ref = ref;

	const externalIconSize = size === 'normal' ? 20 : 16;
	const externalIcon = isExternalLink && (
		<Icon size={ externalIconSize } icon={ external } className={ styles[ 'external-icon' ] } />
	);
	const externalTarget = isExternalLink ? '_blank' : undefined;

	return (
		<WPButton
			target={ externalTarget }
			variant={ variant }
			className={ className }
			icon={ ! isExternalLink ? icon : undefined }
			iconSize={ iconSize }
			disabled={ disabled }
			isDestructive={ isDestructive }
			text={ text }
			{ ...componentProps }
		>
			{ isLoading && <Spinner /> }
			<span>{ children }</span>
			{ externalIcon }
		</WPButton>
	);
} );

export default Button;
