import styles from './style.module.scss';
import type { LoadingBlockProps } from './types';
import type { FC } from 'react';

const LoadingBlock: FC< LoadingBlockProps > = ( { height, width } ) => {
	return <div className={ styles.skeleton } style={ { height, width } } />;
};

export default LoadingBlock;
