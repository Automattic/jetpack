import { Notice, ProgressBar, Spinner } from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, cloud, download as downloadIcon, arrowLeft } from '@wordpress/icons';
import { Link, useParams } from '@wordpress/route';
import { Button, Card, Stack, Text } from '@wordpress/ui';
import DashboardLayout from '../components/dashboard-layout';
import RestoreItemsChecklist from '../components/restore-items-checklist';
import { findActivityById } from '../fixtures/activity-log';
import { useMockDownload } from '../hooks/use-mock-download';
import { DEFAULT_RESTORE_ITEMS } from '../types/restore';

/**
 * Download screen — same narrow layout as the Restore screen minus the
 * warning notice. Submission runs through a mocked state machine; the
 * success branch surfaces a synthetic download URL as a link.
 *
 * @return The rendered Download screen.
 */
export default function DownloadScreen() {
	const { rewindId } = useParams( { from: '/download/$rewindId' } );
	const item = findActivityById( rewindId );
	const downloadPoint = item ? item.publishedAt : null;
	const [ items, setItems ] = useState( DEFAULT_RESTORE_ITEMS );
	const { state, submit, reset } = useMockDownload();

	return (
		<DashboardLayout>
			<div className="jpb-download">
				<Link to="/" className="jpb-download__back">
					<Icon icon={ arrowLeft } size={ 18 } />
					{ __( 'Back to overview', 'jetpack-backup-pkg' ) }
				</Link>
				<Card.Root className="jpb-download__card">
					<Stack direction="row" gap="sm" align="center">
						<Icon icon={ cloud } />
						<Stack direction="column" gap="xs">
							<Text variant="heading-md" render={ <h3 /> }>
								{ __( 'Download backup', 'jetpack-backup-pkg' ) }
							</Text>
							{ downloadPoint && (
								<Text variant="body-sm" className="jpb-text-muted">
									{ __( 'Download point:', 'jetpack-backup-pkg' ) }{ ' ' }
									{ dateI18n( 'M j, Y, g:i A', downloadPoint, undefined ) }
								</Text>
							) }
						</Stack>
					</Stack>
					{ ( state.phase === 'idle' || state.phase === 'submitting' ) && (
						<>
							<Text>
								{ __(
									'Choose the items you wish to include in the download:',
									'jetpack-backup-pkg'
								) }
							</Text>
							<RestoreItemsChecklist value={ items } onChange={ setItems } />
							<Button
								className="jpb-download__confirm"
								variant="solid"
								disabled={ state.phase === 'submitting' }
								onClick={ submit }
							>
								{ state.phase === 'submitting' ? (
									<Spinner />
								) : (
									<Icon icon={ downloadIcon } size={ 18 } />
								) }
								{ __( 'Generate download', 'jetpack-backup-pkg' ) }
							</Button>
						</>
					) }
					{ state.phase === 'progress' && (
						<Stack direction="column" gap="sm">
							<Text>{ __( 'Preparing download…', 'jetpack-backup-pkg' ) }</Text>
							<ProgressBar value={ state.percent } />
						</Stack>
					) }
					{ state.phase === 'success' && (
						<Stack direction="column" gap="sm">
							<Notice status="success" isDismissible={ false }>
								{ __( 'Your download is ready.', 'jetpack-backup-pkg' ) }
							</Notice>
							<a className="jpb-download__link" href={ state.downloadUrl }>
								{ __( 'Download the file', 'jetpack-backup-pkg' ) }
							</a>
						</Stack>
					) }
					{ state.phase === 'error' && (
						<Stack direction="column" gap="sm">
							<Notice status="error" isDismissible={ false }>
								{ state.message }
							</Notice>
							<Button className="jpb-download__confirm" variant="outline" onClick={ reset }>
								{ __( 'Try again', 'jetpack-backup-pkg' ) }
							</Button>
						</Stack>
					) }
				</Card.Root>
			</div>
		</DashboardLayout>
	);
}
