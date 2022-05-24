/**
 * External dependencies
 */
import type React from 'react';
import type { ButtonProps } from './types';
import { Button as WPButton, Spinner } from '@wordpress/components';
import { Icon, external } from '@wordpress/icons';
import classNames from 'classnames';
import styles from './style.module.scss';

/**
 * Button component
 *
 * @param {ButtonProps} props - Component Props
 * @returns {React.ReactNode} Rendered button
 */
export const Button: React.FC< ButtonProps > = ( {
	children,
	variant = 'primary',
	size = 'normal',
	weight = 'bold',
	icon,
	iconSize,
	disabled,
	isDestructive,
	isLoading,
	isExternalLink: isExternalLinkProp,
	className: propsClassName,
	text,
	...componentProps
} ) => {
	const className = classNames( styles.button, propsClassName, {
		[ styles.normal ]: size === 'normal',
		[ styles.small ]: size === 'small',
		[ styles.icon ]: Boolean( icon ),
		[ styles.loading ]: isLoading,
		[ styles.regular ]: weight === 'regular',
	} );

	const isExternalLinkDeprecated = variant === 'external-link';
	const isExternalLink = isExternalLinkProp || isExternalLinkDeprecated;

	const externalIconSize = size === 'normal' ? 20 : 16;
	const externalIcon = isExternalLink && (
		<Icon size={ externalIconSize } icon={ external } className={ styles[ 'external-icon' ] } />
	);
	const externalTarget = isExternalLink ? '_blank' : undefined;

	return (
		<WPButton
			target={ externalTarget }
			variant={ isExternalLinkDeprecated ? 'link' : variant }
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
};

export default Button;
