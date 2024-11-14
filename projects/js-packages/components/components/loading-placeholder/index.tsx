import clsx from 'clsx';
import React from 'react';
import styles from './style.module.scss';

const LoadingPlaceholder = ( {
	children = null,
	width = null,
	height = null,
	className = '',
}: {
	children?: React.ReactNode;
	width?: number | string;
	height?: number;
	className?: string;
} ) => {
	return (
		<div className={ clsx( styles.placeholder, className ) } style={ { width, height } }>
			{ children }
		</div>
	);
};

export default LoadingPlaceholder;
