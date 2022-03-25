/**
 * External dependencies
 */
import React from 'react';
import { Button as WPButton } from '@wordpress/components';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import styles from './style.module.scss';

export const BUTTON_SIZES = {
	NORMAL: 'normal',
	SMALL: 'small',
};

const Button = ( { children, variant, size, icon, disabled } ) => {
	const className = classNames( styles.button, {
		[ styles.normal ]: size === BUTTON_SIZES.NORMAL,
		[ styles.small ]: size === BUTTON_SIZES.SMALL,
		[ styles.icon ]: Boolean( icon ),
	} );

	return (
		<WPButton variant={ variant } className={ className } icon={ icon } disabled={ disabled }>
			{ children }
		</WPButton>
	);
};

Button.propTypes = {
	variant: PropTypes.oneOf( [ 'primary', 'secondary', 'link' ] ),
	size: PropTypes.oneOf( [ BUTTON_SIZES.NORMAL, BUTTON_SIZES.SMALL ] ),
	disabled: PropTypes.bool,
};

Button.defaultProps = {
	variant: 'primary',
	size: BUTTON_SIZES.NORMAL,
	disabled: false,
};

export default Button;
