import { ProgressBar } from '@wordpress/components';
import { Text } from '@wordpress/ui';
import styles from './indeterminate-progress.module.scss';
import type { ReactNode } from 'react';

export default function IndeterminateProgress( {
	label,
	children,
	isGenerating = true,
	live = false,
}: {
	label: string;
	children: ReactNode;
	isGenerating?: boolean;
	live?: boolean;
} ) {
	return (
		<div className={ styles.pending }>
			<Text variant="body-md" role={ live ? 'status' : undefined }>
				{ children }
			</Text>
			{ isGenerating && <ProgressBar className={ styles.progress } aria-label={ label } /> }
		</div>
	);
}
