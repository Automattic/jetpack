import clsx from 'clsx';

import './button.scss';

export const DecoratedButton = ( { className, size, label, isPressed, ...extraProps } ) => (
	<button
		type="button"
		aria-label={ label }
		aria-pressed={ isPressed }
		className={ clsx(
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

export const SimpleButton = ( { className, size = 24, label, isPressed, ...extraProps } ) => (
	<button
		type="button"
		aria-label={ label }
		aria-pressed={ isPressed }
		className={ clsx( 'jetpack-mdc-icon-button', className ) }
		style={ {
			width: `${ size }px`,
			height: `${ size }px`,
		} }
		{ ...extraProps }
	/>
);
