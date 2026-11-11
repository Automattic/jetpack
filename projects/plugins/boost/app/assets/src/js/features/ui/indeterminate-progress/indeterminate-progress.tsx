import { Progress, Text } from '@wordpress/ui';
import styles from './indeterminate-progress.module.scss';
import type { ReactNode } from 'react';

export default function IndeterminateProgress( {
	label,
	children,
	isGenerating = true,
	live = false,
	value,
}: {
	label: string;
	children: ReactNode;
	isGenerating?: boolean;
	live?: boolean;
	value?: number;
} ) {
	return (
		<div className={ styles.pending }>
			<Text variant="body-md" role={ live ? 'status' : undefined }>
				{ children }
			</Text>
			{ isGenerating && (
				<Progress.Root className={ styles.progress } value={ value ?? null } aria-label={ label }>
					<Progress.Track className={ styles.track }>
						<Progress.Indicator className={ styles.indicator } />
					</Progress.Track>
				</Progress.Root>
			) }
		</div>
	);
}
