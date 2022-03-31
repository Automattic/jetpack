/**
 * External dependencies
 */
import React from 'react';
import { Button as WPButton, Spinner } from '@wordpress/components';
import { Icon, external } from '@wordpress/icons';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import styles from './style.module.scss';

export const BUTTON_SIZES = {
	NORMAL: 'normal',
	SMALL: 'small',
};

export const BUTTON_VARIANTS = {
	PRIMARY: 'primary',
	SECONDARY: 'secondary',
	LINK: 'link',
	EXTERNAL_LINK: 'external-link',
};

const Button = ( {
	children,
	variant,
	size,
	icon,
	disabled,
	isDestructive,
	isLoading,
	className: propsClassName,
	text,
} ) => {
	const isExternalLink = variant === BUTTON_VARIANTS.EXTERNAL_LINK;
	const externalIconSize = size === BUTTON_SIZES.NORMAL ? 20 : 16;
	const className = classNames( styles.button, {
		[ styles.normal ]: size === BUTTON_SIZES.NORMAL,
		[ styles.small ]: size === BUTTON_SIZES.SMALL,
		[ styles.icon ]: Boolean( icon ),
		propsClassName,
	} );

	return (
		<WPButton
			variant={ isExternalLink ? 'link' : variant }
			className={ className }
			icon={ icon }
			disabled={ disabled }
			isDestructive={ isDestructive }
			text={ text }
		>
			{ isLoading ? (
				<Spinner />
			) : (
				<>
					{ children }
					{ isExternalLink && <Icon size={ externalIconSize } icon={ external } /> }
				</>
			) }
		</WPButton>
	);
};

Button.propTypes = {
	variant: PropTypes.oneOf( [
		BUTTON_VARIANTS.PRIMARY,
		BUTTON_VARIANTS.SECONDARY,
		BUTTON_VARIANTS.LINK,
		BUTTON_VARIANTS.EXTERNAL_LINK,
	] ),
	size: PropTypes.oneOf( [ BUTTON_SIZES.NORMAL, BUTTON_SIZES.SMALL ] ),
	disabled: PropTypes.bool,
	isDestructive: PropTypes.bool,
	isLoading: PropTypes.bool,
	className: PropTypes.string,
	text: PropTypes.string,
};

Button.defaultProps = {
	variant: BUTTON_VARIANTS.PRIMARY,
	size: BUTTON_SIZES.NORMAL,
	disabled: false,
	isDestructive: false,
	isLoading: false,
};

export default Button;
