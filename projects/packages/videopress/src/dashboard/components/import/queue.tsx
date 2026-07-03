import { Spinner } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Badge, Button, Stack, Text } from '@wordpress/ui';
import type { ImportJobItemStatus } from '../../hooks/use-import-job';

export type QueueItem = {
	externalId: string;
	title: string;
	status: ImportJobItemStatus;
	error: { code: string; message: string } | null;
};

type Props = {
	/** Per-video progress entries, in the order the import was requested. */
	items: QueueItem[];
	/** True from the import POST until the job reports a terminal status. */
	isImporting: boolean;
	/** Re-import one failed video. */
	onRetry: ( externalId: string ) => void;
	/** Navigate back to the library; only offered once the job settled. */
	onBack: () => void;
};

/**
 * Status row list for an in-flight (or settled) import job: a spinner-badge
 * while an item is queued, an "Imported" badge when done, and a "Failed"
 * badge with the error message and a per-item Retry button on failure. Once
 * nothing is running anymore, a "Back to library" action appears.
 *
 * @param props             - Component props.
 * @param props.items       - Per-video progress entries, in request order.
 * @param props.isImporting - True until the job reports a terminal status.
 * @param props.onRetry     - Re-import one failed video.
 * @param props.onBack      - Navigate back to the library.
 * @return The queue element.
 */
export default function ImportQueue( { items, isImporting, onRetry, onBack }: Props ) {
	const doneCount = items.filter( item => item.status === 'done' ).length;

	return (
		<Stack direction="column" gap="md" className="vp-import__queue">
			<Text className="vp-import__queue-heading">
				{ isImporting
					? __( 'Importing from YouTube…', 'jetpack-videopress-pkg' )
					: sprintf(
							/* translators: 1: number of videos imported. 2: number of videos requested. */
							_n(
								'Imported %1$d of %2$d video.',
								'Imported %1$d of %2$d videos.',
								items.length,
								'jetpack-videopress-pkg'
							),
							doneCount,
							items.length
					  ) }
			</Text>
			<Text variant="body-sm" className="vp-import__queue-hint">
				{ _n(
					'The imported video appears in your library as a draft until you attach its video file.',
					'Imported videos appear in your library as drafts until you attach their video files.',
					items.length,
					'jetpack-videopress-pkg'
				) }
			</Text>
			<ul className="vp-import__queue-list">
				{ items.map( item => (
					<li key={ item.externalId } className="vp-import__queue-item">
						<Stack direction="row" gap="sm" align="center" justify="space-between">
							<span className="vp-import__queue-title" title={ item.title }>
								{ item.title }
							</span>
							<Stack direction="row" gap="sm" align="center">
								{ item.status === 'queued' ? (
									<>
										<Spinner />
										<Badge intent="informational">
											{ __( 'Importing…', 'jetpack-videopress-pkg' ) }
										</Badge>
									</>
								) : null }
								{ item.status === 'done' ? (
									<Badge intent="stable">{ __( 'Imported', 'jetpack-videopress-pkg' ) }</Badge>
								) : null }
								{ item.status === 'failed' ? (
									<>
										<Badge intent="high">{ __( 'Failed', 'jetpack-videopress-pkg' ) }</Badge>
										<Button
											variant="outline"
											size="compact"
											onClick={ () => onRetry( item.externalId ) }
										>
											{ __( 'Retry', 'jetpack-videopress-pkg' ) }
										</Button>
									</>
								) : null }
							</Stack>
						</Stack>
						{ item.status === 'failed' && item.error?.message ? (
							<Text variant="body-sm" className="vp-import__queue-error">
								{ item.error.message }
							</Text>
						) : null }
					</li>
				) ) }
			</ul>
			{ ! isImporting ? (
				<Stack direction="row" gap="sm" className="vp-import__queue-actions">
					<Button onClick={ onBack }>{ __( 'Back to library', 'jetpack-videopress-pkg' ) }</Button>
				</Stack>
			) : null }
		</Stack>
	);
}
