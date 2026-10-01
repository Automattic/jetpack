import { ProgressBar } from '@wordpress/components';
import styles from './indeterminate-progress.module.scss';
import type { ReactNode } from 'react';

export default function IndeterminateProgress( {
	label,
	children,
}: {
	label: string;
	children: ReactNode;
} ) {
	return (
		<div className={ styles.pending }>
			<span>{ children }</span>
			<ProgressBar className={ styles.progress } aria-label={ label } />
		</div>
	);
}
