import { useInstanceId } from '@wordpress/compose';
import { Fragment, useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { Link as RouterLink } from '@wordpress/route';
import { Button, CheckboxControl, Collapsible, Link, Notice, Stack, Text } from '@wordpress/ui';
import { announce, cancelAnnouncement } from '../../data/announce';
import { parseRestoreWhen } from '../../data/api/restore';
import { formatDate, formatDateTime } from '../../data/date-format';
import './style.scss';
import type { KnownThreat, KnownThreats } from '../../data/api/known-threats';

type Props = {
	/** What the screen knows about the backup's threats; null when unavailable. */
	threats: KnownThreats | null;
	/** Omit, with `onAcknowledge`, to show the warning without the checkbox. */
	acknowledged?: boolean;
	onAcknowledge?: ( next: boolean ) => void;
	/** Period of the newest backup without known threats, for the "Restore … instead" link. */
	restoreInsteadPeriod?: number | null;
	/** That backup's "Backup complete" rewind id, which names it and is restored instead. */
	restoreInsteadRewindId?: string | null;
};

/**
 * A threat date in the site's own format and timezone, like every other date in the dashboard.
 *
 * @param value - A UTC timestamp; one with no zone is read as UTC, not local time.
 * @return The formatted date, or an empty string when it cannot be read.
 */
function threatDate( value: string | null | undefined ): string {
	const ms = value ? parseRestoreWhen( value ) : null;
	return ms === null ? '' : formatDate( ms );
}

/**
 * What to call a threat: its signature, else its kind.
 *
 * @param threat - The threat.
 * @return The label.
 */
function threatName( threat: KnownThreat ): string {
	if ( threat.signature ) {
		return threat.signature;
	}
	return threat.kind === 'database'
		? __( 'Database threat', 'jetpack-backup-pkg' )
		: __( 'Malware', 'jetpack-backup-pkg' );
}

/**
 * Where a threat lives: `slug@version` for a plugin or theme, else its path, else its target.
 *
 * @param threat - The threat.
 * @return A short location.
 */
function where( threat: KnownThreat ): string {
	if ( threat.slug ) {
		return threat.version ? `${ threat.slug }@${ threat.version }` : threat.slug;
	}
	return threat.path || threat.target || '';
}

/**
 * A path that wraps only after its slashes, never inside a file name.
 *
 * @param path - The path.
 * @return The path with a line-break opportunity after each slash.
 */
function breakablePath( path: string ) {
	return path.split( '/' ).map( ( segment, index, segments ) => (
		<Fragment key={ index }>
			{ segment }
			{ index < segments.length - 1 && (
				<>
					/<wbr />
				</>
			) }
		</Fragment>
	) );
}

/**
 * The threat's status today.
 *
 * @param threat - The threat.
 * @return "Fixed <date>", "Ignored" or "Open".
 */
function statusNow( threat: KnownThreat ): string {
	if ( threat.state === 'fixed' ) {
		const fixedOn = threatDate( threat.fixed_on );
		return fixedOn
			? sprintf(
					/* translators: %s: the date the threat was fixed. */
					__( 'Fixed %s', 'jetpack-backup-pkg' ),
					fixedOn
				)
			: __( 'Fixed', 'jetpack-backup-pkg' );
	}
	if ( threat.status === 'ignored' ) {
		return __( 'Ignored', 'jetpack-backup-pkg' );
	}
	return __( 'Open', 'jetpack-backup-pkg' );
}

/**
 * When a threat was first seen and where it stands now, as one line.
 *
 * @param threat - The threat.
 * @return The line.
 */
function threatDetails( threat: KnownThreat ): string {
	const reportedOn = threatDate( threat.reported_on );
	return reportedOn
		? sprintf(
				/* translators: 1: the date Scan first detected a threat, 2: its status now, such as "Open" or "Fixed Oct 17, 2026". */
				__( 'First detected %1$s · %2$s', 'jetpack-backup-pkg' ),
				reportedOn,
				statusNow( threat )
			)
		: statusNow( threat );
}

/**
 * The known-threats warning: the sentence, the threats behind a "Show threats" toggle, a link to
 * the newest clean backup and, on the restore screen and in the backup details, the checkbox.
 *
 * Also rendered after the edge case of a server-side refusal over threats the screen did not
 * know about, when `threats` may be null.
 *
 * @param props                        - Component props.
 * @param props.threats                - What the screen knows about the backup's threats.
 * @param props.acknowledged           - Whether the checkbox is ticked.
 * @param props.onAcknowledge          - Called with the checkbox's new value.
 * @param props.restoreInsteadPeriod   - Period of the newest backup without known threats.
 * @param props.restoreInsteadRewindId - That backup's "Backup complete" rewind id.
 * @return The rendered warning.
 */
export default function KnownThreatsWarning( {
	threats,
	acknowledged = false,
	onAcknowledge,
	restoreInsteadPeriod,
	restoreInsteadRewindId,
}: Props ) {
	const [ open, setOpen ] = useState( false );
	const restoreInsteadHintId = `jpb-known-threats-restore-instead-${ useInstanceId(
		KnownThreatsWarning
	) }`;
	const restoreInsteadHint = __(
		"It's the most recent backup with no known security threats.",
		'jetpack-backup-pkg'
	);
	const flagged = threats?.summary.flagged ?? 0;
	const vulnerable = threats?.summary.vulnerable ?? 0;
	const listed = threats?.threats.length ?? 0;
	const truncated = !! threats && ( threats.truncated || threats.count > listed );
	const rows = ( threats?.threats ?? [] ).filter(
		threat => threat.kind === 'malware' || threat.kind === 'database'
	);
	const currentPeriod = threats ? Math.floor( Number( threats.backup_id ) ) : null;
	const showRestoreInstead =
		restoreInsteadPeriod !== null &&
		restoreInsteadPeriod !== undefined &&
		restoreInsteadPeriod !== currentPeriod;
	const warning =
		flagged > 0
			? sprintf(
					/* translators: %d: number of known security threats in the backup. */
					_n(
						'This backup is known to contain %d security threat. Restoring it may bring malware back to your site.',
						'This backup is known to contain %d security threats. Restoring it may bring malware back to your site.',
						flagged,
						'jetpack-backup-pkg'
					),
					flagged
				)
			: '';

	// The warning arrives after the page has rendered, so screen readers would otherwise miss it.
	// Queued with `announce()` so a message spoken at the same moment doesn't cut it off.
	useEffect( () => {
		if ( ! warning ) {
			return;
		}
		announce( warning, 'polite', KnownThreatsWarning );
		return () => cancelAnnouncement( KnownThreatsWarning );
	}, [ warning ] );

	return (
		<div className="jpb-known-threats">
			<Notice.Root intent="warning">
				<Notice.Description>
					{ warning ||
						__(
							'This backup is known to contain security threats. Acknowledge them to restore it.',
							'jetpack-backup-pkg'
						) }
				</Notice.Description>
				{ flagged > 0 && ( rows.length > 0 || vulnerable > 0 ) && (
					<Notice.Description render={ <div /> }>
						<Collapsible.Root open={ open } onOpenChange={ setOpen }>
							<Collapsible.Trigger
								render={ <Button variant="outline" tone="neutral" size="compact" /> }
							>
								{ open
									? __( 'Hide threats', 'jetpack-backup-pkg' )
									: __( 'Show threats', 'jetpack-backup-pkg' ) }
								<Button.Icon icon={ open ? chevronUp : chevronDown } />
							</Collapsible.Trigger>
							<Collapsible.Panel className="jpb-known-threats__panel">
								{ rows.length > 0 && (
									<ul
										className="jpb-known-threats__list"
										aria-label={ __( 'Known threats in this backup', 'jetpack-backup-pkg' ) }
									>
										{ rows.map( threat => (
											<li key={ threat.id } className="jpb-known-threats__threat">
												<Text variant="body-md" className="jpb-known-threats__name">
													{ threatName( threat ) }
												</Text>
												{ where( threat ) && (
													<Text variant="body-sm" className="jpb-known-threats__where">
														<bdi>{ breakablePath( where( threat ) ) }</bdi>
													</Text>
												) }
												<Text variant="body-sm">{ threatDetails( threat ) }</Text>
											</li>
										) ) }
									</ul>
								) }
								{ truncated && (
									<Text variant="body-sm" render={ <p /> }>
										{ sprintf(
											/* translators: %d: number of threats listed above. */
											_n(
												'Showing the first %d threat.',
												'Showing the first %d threats.',
												listed,
												'jetpack-backup-pkg'
											),
											listed
										) }
									</Text>
								) }
								{ vulnerable > 0 && (
									<Text variant="body-sm" render={ <p /> }>
										{ sprintf(
											/* translators: %d: number of vulnerable plugin or theme versions in the backup. */
											_n(
												'Also: %d vulnerable plugin or theme version.',
												'Also: %d vulnerable plugin or theme versions.',
												vulnerable,
												'jetpack-backup-pkg'
											),
											vulnerable
										) }
									</Text>
								) }
							</Collapsible.Panel>
						</Collapsible.Root>
					</Notice.Description>
				) }
				{ showRestoreInstead && (
					// A description rather than `Notice.Actions`, whose links don't wrap at phone width.
					<Notice.Description render={ <div /> }>
						<Stack direction="column" gap="xs" align="start">
							<Link
								tone="neutral"
								aria-describedby={ restoreInsteadHintId }
								render={
									<RouterLink
										to={ `/restore/${ restoreInsteadRewindId ?? restoreInsteadPeriod }` }
									/>
								}
							>
								{ restoreInsteadRewindId
									? sprintf(
											/* translators: %s: a backup's date and time. */
											__( 'Restore %s backup instead', 'jetpack-backup-pkg' ),
											formatDateTime( new Date( Number( restoreInsteadRewindId ) * 1000 ) )
										)
									: __(
											'Restore the latest backup without known threats instead',
											'jetpack-backup-pkg'
										) }
							</Link>
							<Text variant="body-sm" id={ restoreInsteadHintId }>
								{ restoreInsteadHint }
							</Text>
						</Stack>
					</Notice.Description>
				) }
				{ onAcknowledge && (
					<Notice.Description render={ <div /> } className="jpb-known-threats__acknowledgement">
						<CheckboxControl
							label={ __(
								'I understand this backup contains known threats and want to restore it anyway.',
								'jetpack-backup-pkg'
							) }
							checked={ acknowledged }
							onCheckedChange={ onAcknowledge }
						/>
					</Notice.Description>
				) }
			</Notice.Root>
		</div>
	);
}
