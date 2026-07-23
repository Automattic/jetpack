import { Notice, ProgressBar, Spinner } from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, backup as backupIcon, arrowLeft } from '@wordpress/icons';
import { Link, useParams } from '@wordpress/route';
import { Button, Card, Stack, Text } from '@wordpress/ui';
import DashboardLayout from '../components/dashboard-layout';
import RestoreItemsChecklist from '../components/restore-items-checklist';
import { findActivityById } from '../fixtures/activity-log';
import { useMockRestore } from '../hooks/use-mock-restore';
import { DEFAULT_RESTORE_ITEMS } from '../types/restore';

/**
 * Restore screen — narrow centered layout with the warning notice, the
 * shared item checklist, and a Confirm button. Submit transitions
 * through a synthetic state machine; ~10% of submits land in the error
 * branch.
 *
 * @return The rendered Restore screen.
 */
export default function RestoreScreen() {
	const { rewindId } = useParams( { from: '/restore/$rewindId' } );
	const item = findActivityById( rewindId );
	const restorePoint = item ? item.publishedAt : null;
	const [ items, setItems ] = useState( DEFAULT_RESTORE_ITEMS );
	const { state, submit, reset } = useMockRestore();

	return (
		<DashboardLayout>
			<div className="jpb-restore">
				<Link to="/" className="jpb-restore__back">
					<Icon icon={ arrowLeft } size={ 18 } />
					{ __( 'Back to overview', 'jetpack-backup-pkg' ) }
				</Link>
				<Card.Root className="jpb-restore__card">
					<Stack direction="row" gap="sm" align="center">
						<Icon icon={ backupIcon } />
						<Stack direction="column" gap="xs">
							<Text variant="heading-md" render={ <h3 /> }>
								{ __( 'Restore backup', 'jetpack-backup-pkg' ) }
							</Text>
							{ restorePoint && (
								<Text variant="body-sm" className="jpb-text-muted">
									{ __( 'Restore point:', 'jetpack-backup-pkg' ) }{ ' ' }
									{ dateI18n( 'M j, Y, g:i A', restorePoint, undefined ) }
								</Text>
							) }
						</Stack>
					</Stack>
					{ ( state.phase === 'idle' || state.phase === 'submitting' ) && (
						<>
							<Notice status="warning" isDismissible={ false }>
								{ __(
									'Restoring will overwrite the matching parts of your live site with the contents of this backup. This cannot be undone.',
									'jetpack-backup-pkg'
								) }
							</Notice>
							<Text>{ __( 'Choose the items you wish to restore:', 'jetpack-backup-pkg' ) }</Text>
							<RestoreItemsChecklist value={ items } onChange={ setItems } />
							<Button
								className="jpb-restore__confirm"
								variant="solid"
								disabled={ state.phase === 'submitting' }
								onClick={ submit }
							>
								{ state.phase === 'submitting' ? (
									<Spinner />
								) : (
									<Icon icon={ backupIcon } size={ 18 } />
								) }
								{ __( 'Confirm restore', 'jetpack-backup-pkg' ) }
							</Button>
						</>
					) }
					{ state.phase === 'progress' && (
						<Stack direction="column" gap="sm">
							<Text>{ __( 'Restoring…', 'jetpack-backup-pkg' ) }</Text>
							<ProgressBar value={ state.percent } />
						</Stack>
					) }
					{ state.phase === 'success' && (
						<Stack direction="column" gap="sm">
							<Notice status="success" isDismissible={ false }>
								{ __( 'Restore complete.', 'jetpack-backup-pkg' ) }
							</Notice>
							<Link to="/">{ __( 'Back to overview', 'jetpack-backup-pkg' ) }</Link>
						</Stack>
					) }
					{ state.phase === 'error' && (
						<Stack direction="column" gap="sm">
							<Notice status="error" isDismissible={ false }>
								{ state.message }
							</Notice>
							<Button className="jpb-restore__confirm" variant="outline" onClick={ reset }>
								{ __( 'Try again', 'jetpack-backup-pkg' ) }
							</Button>
						</Stack>
					) }
				</Card.Root>
			</div>
		</DashboardLayout>
	);
}
