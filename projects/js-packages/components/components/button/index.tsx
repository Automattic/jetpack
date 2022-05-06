/**
 * External dependencies
 */
import type React from 'react';
import { Button as WPButton, Spinner } from '@wordpress/components';
import { Icon, external } from '@wordpress/icons';
import classNames from 'classnames';
import styles from './style.module.scss';

export type ButtonProps = Omit< WPButton.Props, 'size' | 'variant' > & {
	className?: string;
	children?: React.ReactNode;
	disabled?: boolean;
	isDestructive?: boolean;
	isLoading?: boolean;
	size?: 'normal' | 'small';
	text?: string;
	variant?: 'primary' | 'secondary' | 'link' | 'external-link';
	weight?: 'bold' | 'regular';
};

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

	const isExternalLink = variant === 'external-link';
	const externalIconSize = size === 'normal' ? 20 : 16;
	const externalIcon = isExternalLink && (
		<Icon size={ externalIconSize } icon={ external } className={ styles[ 'external-icon' ] } />
	);
	const externalTarget = isExternalLink ? '_blank' : undefined;

	return (
		<WPButton
			target={ externalTarget }
			variant={ isExternalLink ? 'link' : variant }
			className={ className }
			icon={ ! isExternalLink ? icon : undefined }
			iconSize={ iconSize }
			disabled={ disabled }
			isDestructive={ isDestructive }
			text={ text }
			// cast as unknown to make TS happy about this being used both <a /> and <button /> 🤷‍♂️
			{ ...( componentProps as unknown ) }
		>
			{ isLoading && <Spinner /> }
			<span>{ children }</span>
			{ externalIcon }
		</WPButton>
	);
};

export default Button;
