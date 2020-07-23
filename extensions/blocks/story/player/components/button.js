/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './icons.scss';

export const MaterialIcon = ( { icon, size = 24 } ) => (
	<i className={ `jetpack-material-icons ${ icon }` } style={ { fontSize: size } }></i>
);

export const Button = ( {
	label,
	icon,
	onClick,
	size = 24,
	iconSize = 24,
	className = null,
	circled = false,
	outlined = false,
	bordered = false,
} ) => {
	return (
		<button
			className={ classnames( {
				'jetpack-mdc-icon-button': true,
				'circle-icon': circled,
				outlined: outlined,
				bordered: bordered,
				[ className ]: !! className,
			} ) }
			style={ {
				width: `${ size }px`,
				height: `${ size }px`,
			} }
			aria-label={ label }
			aria-pressed="false"
			onClick={ onClick }
		>
			{ typeof icon === 'function' ? (
				<icon size={ iconSize } />
			) : (
				<MaterialIcon icon={ icon } size={ iconSize } />
			) }
		</button>
	);
};

export const DecoratedButton = props => (
	<Button circled outlined bordered size={ 64 } iconSize={ 36 } { ...props } />
);

export const SimpleButton = ( { size = 24, ...props } ) => (
	<Button size={ size } iconSize={ size } { ...props } />
);
