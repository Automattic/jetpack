import React, { ReactNode } from 'react';
import classNames from 'classnames';
import styles from './button.module.scss';

interface ButtonProps {
	small?: boolean;
	fill?: boolean;
	width?: string | null;
	href?: string;
	disabled?: boolean;
	children: ReactNode;
	onClick?: () => void;
}

const Button: React.FC< ButtonProps > = ( {
	small = false,
	fill = false,
	width = null,
	href = '',
	disabled = false,
	children,
	onClick = () => {},
} ) => {
	const buttonStyle = {
		width: width || 'auto',
	};

	const buttonClassNames = classNames( 'button', styles.button, {
		[ styles.small ]: small,
		[ styles.fill ]: fill,
	} );

	return href ? (
		<a href={ href } onClick={ onClick } className={ buttonClassNames } style={ buttonStyle }>
			{ children }
		</a>
	) : (
		<button
			onClick={ onClick }
			className={ buttonClassNames }
			disabled={ disabled }
			style={ buttonStyle }
		>
			{ children }
		</button>
	);
};

export default Button;
