import classNames from 'classnames';
import React from 'react';
import styles from './style.module.scss';

const Placeholder = ( {
	children = null,
	width = null,
	height = null,
	className = '',
}: {
	children?: React.ReactNode;
	width?: number;
	height?: number;
	className?: string;
} ) => {
	return (
		<div className={ classNames( styles.placeholder, className ) } style={ { width, height } }>
			{ children }
		</div>
	);
};

export default Placeholder;
