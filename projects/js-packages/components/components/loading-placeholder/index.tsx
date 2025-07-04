import clsx from 'clsx';
import styles from './style.module.scss';
import type { ReactNode } from 'react';

const LoadingPlaceholder = ( {
	children = null,
	width = null,
	height = null,
	className = '',
}: {
	children?: ReactNode;
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
