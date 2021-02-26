/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';
import './button.scss';

export const DecoratedButton = ( { className, size, isPressed, ...extraProps } ) => (
	<button
		type="button"
		aria-pressed={ isPressed }
		className={ classNames(
			'jetpack-mdc-icon-button',
			'circle-icon',
			'outlined',
			'bordered',
			className
		) }
		style={ {
			width: `${ size }px`,
			height: `${ size }px`,
		} }
		{ ...extraProps }
	/>
);

export const SimpleButton = ( { className, size = 24, isPressed, ...extraProps } ) => (
	<button
		type="button"
		aria-pressed={ isPressed }
		className={ classNames( 'jetpack-mdc-icon-button', className ) }
		style={ {
			width: `${ size }px`,
			height: `${ size }px`,
		} }
		{ ...extraProps }
	/>
);
