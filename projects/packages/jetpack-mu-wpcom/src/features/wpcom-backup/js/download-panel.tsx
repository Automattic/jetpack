import { speak } from '@wordpress/a11y';
import { dateI18n, getSettings } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	ButtonLink,
	Card,
	CheckboxControl,
	Fieldset,
	Notice,
	Progress,
	Stack,
	Text,
} from '@wordpress/ui';
import { useEffect, useRef, useState } from 'react';
import { useTracks } from '../../wpcom-hosting-feature-page/js/tracks.ts';
import { ALL_ITEMS, hasSelectedItems } from './download.ts';
import { useLastBackupDownload } from './use-last-backup-download.ts';
import type { DownloadItems } from './download.ts';
import type { DownloadPhase } from './use-last-backup-download.ts';

/**
 * The checklist, in the order and words of the Backup dashboard's.
 *
 * @return One entry per category.
 */
function getItems(): { key: keyof DownloadItems; label: string; description?: string }[] {
	return [
		{ key: 'themes', label: __( 'WordPress themes', 'jetpack-mu-wpcom' ) },
		{ key: 'plugins', label: __( 'WordPress plugins', 'jetpack-mu-wpcom' ) },
		{
			key: 'roots',
			label: __( 'WordPress root', 'jetpack-mu-wpcom' ),
			description: __( 'Includes wp-config.php and any non-WordPress files.', 'jetpack-mu-wpcom' ),
		},
		{
			key: 'contents',
			label: __( 'WP-content directory', 'jetpack-mu-wpcom' ),
			description: __( 'Excludes themes, plugins, and uploads.', 'jetpack-mu-wpcom' ),
		},
		{
			key: 'sqls',
			label: __( 'Site database', 'jetpack-mu-wpcom' ),
			description: __( 'Includes pages and posts.', 'jetpack-mu-wpcom' ),
		},
		{ key: 'uploads', label: __( 'Media uploads', 'jetpack-mu-wpcom' ) },
	];
}

/**
 * What a screen reader hears when the download settles.
 *
 * @param phase - The current phase.
 * @return The announcement, or an empty string.
 */
function announcementFor( phase: DownloadPhase ): string {
	if ( phase.name === 'ready' ) {
		return __( 'Your file is ready to download.', 'jetpack-mu-wpcom' );
	}

	return phase.name === 'error' ? phase.message : '';
}

/**
 * Offers a site whose transfer was reverted its last backup, as a file to download.
 *
 * Renders nothing until that backup is found, and nothing if there is none.
 *
 * @param props            - Component props.
 * @param props.supportUrl - Support's contact page.
 * @return The rendered panel.
 */
export function DownloadPanel( { supportUrl }: { supportUrl: string } ) {
	const { backup, phase, submit, reset } = useLastBackupDownload();
	const { recordTracksEvent } = useTracks();
	const [ items, setItems ] = useState< DownloadItems >( ALL_ITEMS );
	const heading = useRef< HTMLHeadingElement >( null );
	const hasActed = useRef( false );
	const isLoaded = useRef( false );

	// A step's button vanishes once clicked, so catch the focus it drops; never on load.
	useEffect( () => {
		const node = heading.current;
		const active = node?.ownerDocument.activeElement;

		if ( hasActed.current && node && ( ! active || active === node.ownerDocument.body ) ) {
			node.focus();
		}
	}, [ phase.name ] );

	// A download resumed on load is already on screen, so speak only what changes after it.
	useEffect( () => {
		if ( backup === undefined ) {
			return;
		}

		if ( ! isLoaded.current ) {
			isLoaded.current = true;
			return;
		}

		const message = announcementFor( phase );

		if ( message ) {
			speak( message, phase.name === 'error' ? 'assertive' : 'polite' );
		}
	}, [ backup, phase ] );

	if ( ! backup ) {
		return null;
	}

	const isSubmitting = phase.name === 'submitting';

	return (
		<Card.Root>
			<Card.Content>
				<Stack direction="column" gap="lg" align="flex-start">
					<Text variant="heading-md" render={ <h2 ref={ heading } tabIndex={ -1 } /> }>
						{ sprintf(
							/* translators: %s: the date the backup was taken. */
							__( 'You have a backup from %s', 'jetpack-mu-wpcom' ),
							dateI18n( getSettings().formats.date, backup.takenAt )
						) }
					</Text>
					<Text>
						{ __(
							'Your site’s last backup can still be downloaded. To restore it, and to get automatic backups again, upgrade your plan.',
							'jetpack-mu-wpcom'
						) }
					</Text>

					{ phase.name === 'ready' && (
						<>
							<Text>{ __( 'Your file is ready to download.', 'jetpack-mu-wpcom' ) }</Text>
							<ButtonLink
								variant="solid"
								size="compact"
								href={ phase.url }
								onClick={ () => recordTracksEvent( 'calypso_jetpack_backup_file_download' ) }
							>
								{ phase.size
									? sprintf(
											/* translators: %s: the file's size, such as "1.2 GB". */
											__( 'Download file (%s)', 'jetpack-mu-wpcom' ),
											phase.size
										)
									: __( 'Download file', 'jetpack-mu-wpcom' ) }
							</ButtonLink>
						</>
					) }

					{ ( phase.name === 'idle' || isSubmitting || phase.name === 'ready' ) && (
						<>
							<Fieldset.Root>
								<Fieldset.Legend>
									{ __( 'Choose what to include in the download', 'jetpack-mu-wpcom' ) }
								</Fieldset.Legend>
								<Stack direction="column" gap="sm">
									{ getItems().map( item => (
										<CheckboxControl
											key={ item.key }
											label={ item.label }
											description={ item.description }
											checked={ items[ item.key ] }
											disabled={ isSubmitting }
											onCheckedChange={ checked =>
												setItems( previous => ( { ...previous, [ item.key ]: checked } ) )
											}
										/>
									) ) }
								</Stack>
							</Fieldset.Root>
							<Button
								// The download link is the primary action once a file exists.
								variant={ phase.name === 'ready' ? 'outline' : 'solid' }
								size="compact"
								loading={ isSubmitting }
								disabled={ isSubmitting || ! hasSelectedItems( items ) }
								onClick={ () => {
									hasActed.current = true;
									submit( items );
								} }
							>
								{ __( 'Create downloadable file', 'jetpack-mu-wpcom' ) }
							</Button>
						</>
					) }

					{ phase.name === 'progress' && (
						// No reading yet is not 0%; a bar pinned there would look stalled.
						<Progress.Root
							className="wpcom-hosting-feature__download-progress"
							value={ phase.percent > 0 ? phase.percent : null }
						>
							<Stack justify="space-between" gap="sm">
								<Progress.Label>
									{ __( 'Creating your downloadable file', 'jetpack-mu-wpcom' ) }
								</Progress.Label>
								<Progress.Value />
							</Stack>
							<Progress.Track>
								<Progress.Indicator />
							</Progress.Track>
						</Progress.Root>
					) }

					{ phase.name === 'error' && (
						<Notice.Root intent="error" className="wpcom-hosting-feature__download-error">
							<Notice.Description>{ phase.message }</Notice.Description>
							<Notice.Actions>
								<Notice.ActionButton
									onClick={ () => {
										hasActed.current = true;
										reset();
									} }
								>
									{ __( 'Try again', 'jetpack-mu-wpcom' ) }
								</Notice.ActionButton>
								<Notice.ActionLink href={ supportUrl } openInNewTab>
									{ __( 'Contact support', 'jetpack-mu-wpcom' ) }
								</Notice.ActionLink>
							</Notice.Actions>
						</Notice.Root>
					) }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
