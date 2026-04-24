/* eslint-disable jsdoc/require-returns */

import { useMutation } from '@tanstack/react-query';
import { Button, Card, CardBody, CardHeader, Icon, Tooltip } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { download, rotateLeft } from '@wordpress/icons';
import { useNavigate } from 'react-router';
import { initiateBackupDownload } from '../../data/fetchers';
import { gridiconToWordPressIcon } from '../../data/gridicons';
import { useFormattedTime } from '../../data/use-formatted-time';
import { JetpackBackupRoutes } from '../../routes';
import FileBrowser from './file-browser';
import { useFileBrowserContext } from './file-browser/file-browser-context';
import styles from './style.module.scss';
import type { ActivityLogEntry } from '../../data/types';
import type { FC, ReactElement } from 'react';

interface BackupDetailsProps {
	backup: ActivityLogEntry;
}

interface ComingSoonButtonProps {
	variant: 'tertiary' | 'primary';
	icon: ReactElement;
	children: string;
}

/**
 * Restore action is rendered disabled with a tooltip explaining the
 * flow is coming soon. Download is wired up now — see `handleDownloadClick`
 * below.
 *
 * @param props          - Component props.
 * @param props.variant  - Button variant.
 * @param props.icon     - Icon element to render in the button.
 * @param props.children - Button label.
 */
const ComingSoonButton: FC< ComingSoonButtonProps > = ( { variant, icon, children } ) => (
	<Tooltip
		text={ __(
			'Coming soon in Jetpack Backup. For now, you can manage this action on WordPress.com.',
			'jetpack-backup-pkg'
		) }
	>
		<Button variant={ variant } icon={ icon } disabled accessibleWhenDisabled>
			{ children }
		</Button>
	</Tooltip>
);

/**
 * Right-hand detail pane for a selected backup: summary, timestamp,
 * actor, Download/Restore actions, and the file-browser tree.
 *
 * @param props        - Component props.
 * @param props.backup - The activity log entry to display.
 */
const BackupDetails: FC< BackupDetailsProps > = ( { backup } ) => {
	const navigate = useNavigate();
	const { fileBrowserState } = useFileBrowserContext();
	const rewindIdNum = Number( backup.rewind_id );
	const { totalItems: selectedFilesCount } = fileBrowserState.getCheckList( rewindIdNum );
	const hasSelectedFiles = selectedFilesCount > 0;

	const publishedTimestamp = backup.published || backup.last_published;
	const formattedTime = useFormattedTime( publishedTimestamp, {
		dateStyle: 'medium',
		timeStyle: 'short',
	} );

	const contentText = backup.content?.text ?? '';
	const actorName = backup.actor?.name ?? '';

	const { mutate: granularMutate, isPending: isGranularPending } = useMutation( {
		mutationFn: () => {
			const { includeList, excludeList } = fileBrowserState.getCheckList( rewindIdNum );
			return initiateBackupDownload( {
				rewindId: backup.rewind_id,
				includePaths: includeList.map( item => item.id ).join( ',' ),
				excludePaths: excludeList.map( item => item.id ).join( ',' ),
			} );
		},
	} );

	const handleDownloadClick = useCallback( () => {
		if ( hasSelectedFiles ) {
			// Granular download: kick off the mutation now (so the paths
			// get captured before the user navigates to the screen) and
			// pass the resulting downloadId so the screen skips the form.
			granularMutate( undefined, {
				onSuccess: downloadId =>
					navigate(
						`${ JetpackBackupRoutes.Download }?rewindId=${ backup.rewind_id }&downloadId=${ downloadId }`
					),
			} );
		} else {
			navigate( `${ JetpackBackupRoutes.Download }?rewindId=${ backup.rewind_id }` );
		}
	}, [ hasSelectedFiles, granularMutate, backup.rewind_id, navigate ] );

	const downloadLabel = hasSelectedFiles
		? sprintf(
				/* translators: %d is the number of files selected. */
				_n(
					'Download %d selected file',
					'Download %d selected files',
					selectedFilesCount,
					'jetpack-backup-pkg'
				),
				selectedFilesCount
		  )
		: __( 'Download backup', 'jetpack-backup-pkg' );

	return (
		<Card>
			<CardHeader>
				<div className={ styles.detailsHeader }>
					<div className={ styles.detailsHeaderTitle }>
						<Icon icon={ gridiconToWordPressIcon( backup.gridicon ) } />
						<strong>{ backup.summary }</strong>
					</div>
					<div className={ styles.detailsHeaderActions }>
						{ backup.rewind_id ? (
							<Button
								variant="tertiary"
								icon={ download }
								onClick={ handleDownloadClick }
								isBusy={ isGranularPending }
								disabled={ isGranularPending }
							>
								{ downloadLabel }
							</Button>
						) : null }
						<ComingSoonButton variant="primary" icon={ rotateLeft }>
							{ __( 'Restore to this point', 'jetpack-backup-pkg' ) }
						</ComingSoonButton>
					</div>
				</div>
			</CardHeader>
			<CardBody>
				<div className={ styles.detailsBody }>
					{ contentText && <span className={ styles.detailsSummary }>{ contentText }</span> }
					<div className={ styles.detailsMeta }>
						<span>{ formattedTime }</span>
						{ actorName && (
							<span>
								{ sprintf(
									/* translators: %s is the name of the person or system that performed the backup. */
									__( 'by %s', 'jetpack-backup-pkg' ),
									actorName
								) }
							</span>
						) }
					</div>
					{ !! backup.object?.backup_period && backup.rewind_id && (
						<div className={ styles.fileBrowserSection }>
							<div className={ styles.fileBrowserSectionTitle }>
								{ __( 'Files', 'jetpack-backup-pkg' ) }
							</div>
							<FileBrowser key={ backup.rewind_id } rewindId={ backup.rewind_id } />
						</div>
					) }
				</div>
			</CardBody>
		</Card>
	);
};

export default BackupDetails;
