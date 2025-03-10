import clsx from 'clsx';
import styles from './style.module.scss';
import type { LoadingBlockProps } from './types';
import type { FC } from 'react';

const LoadingBlock: FC< LoadingBlockProps > = ( {
	height,
	width,
	spaceBelow = false,
	key = '',
} ) => {
	return (
		<div
			key={ key }
			className={ clsx( styles.skeleton, spaceBelow && styles.spaceBelow ) }
			style={ { height, width } }
		/>
	);
};

export default LoadingBlock;
