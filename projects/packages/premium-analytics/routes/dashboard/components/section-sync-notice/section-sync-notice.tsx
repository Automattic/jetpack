/**
 * External dependencies
 */
import { Button, Stack } from '@jetpack-premium-analytics/externals';
import { ProgressBar } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './section-sync-notice.module.scss';

type SectionSyncNoticeProps = {
	/** Sync progress, 0–100. */
	percentage: number;
	hasError: boolean;
	onRetry: () => void;
	isRetrying: boolean;
};

/**
 * Banner above a section whose data is still being synced to WordPress.com.
 *
 * The widgets below it render throughout, so the copy says the numbers are
 * incomplete rather than only that a sync is running: until it finishes they
 * read as zeros, which is a claim about the store rather than about the sync.
 *
 * @param props            - Component props.
 * @param props.percentage - Sync progress, 0–100.
 * @param props.hasError   - Whether the sync failed or stalled.
 * @param props.onRetry    - Starts the sync again.
 * @param props.isRetrying - Whether a retry is in flight.
 * @return The notice.
 */
export function SectionSyncNotice( {
	percentage,
	hasError,
	onRetry,
	isRetrying,
}: SectionSyncNoticeProps ) {
	return (
		<Stack direction="column" gap="sm" className={ styles.notice } role="status">
			<span className={ styles.message }>
				{ hasError
					? __(
							'Something went wrong while syncing your store data. The numbers below are incomplete until it finishes.',
							'jetpack-premium-analytics-pkg'
					  )
					: sprintf(
							/* translators: %d: sync progress percentage. */
							__(
								'Your store data is still syncing (%d%%). The numbers below are incomplete until it finishes.',
								'jetpack-premium-analytics-pkg'
							),
							percentage
					  ) }
			</span>

			{ hasError ? (
				<Button
					variant="outline"
					onClick={ onRetry }
					disabled={ isRetrying }
					loading={ isRetrying }
				>
					{ __( 'Try again', 'jetpack-premium-analytics-pkg' ) }
				</Button>
			) : (
				<ProgressBar value={ percentage } />
			) }
		</Stack>
	);
}
