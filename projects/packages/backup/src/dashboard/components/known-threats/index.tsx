import { CheckboxControl } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { dateI18n } from '@wordpress/date';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Icon, cautionFilled } from '@wordpress/icons';
import { Link as RouterLink } from '@wordpress/route';
import { Link, Text, Tooltip, VisuallyHidden } from '@wordpress/ui';
import { announce, cancelAnnouncement } from '../../data/announce';
import { parseRestoreWhen } from '../../data/api/restore';
import { formatBrowserDate } from '../../data/date-format';
import { KnownThreatsToggle } from './badge';
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
 * A threat date in the browser's local calendar, as Scan shows it elsewhere.
 *
 * @param value - A UTC timestamp; one with no zone is read as UTC, not local time.
 * @return The formatted date, or an empty string when it cannot be read.
 */
function localDate( value: string | null | undefined ): string {
	const ms = value ? parseRestoreWhen( value ) : null;
	return ms === null ? '' : formatBrowserDate( ms );
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
 * The threat's status today.
 *
 * @param threat - The threat.
 * @return "Fixed <date>", "Ignored" or "Open".
 */
function statusNow( threat: KnownThreat ): string {
	if ( threat.state === 'fixed' ) {
		const fixedOn = localDate( threat.fixed_on );
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
 * The known-threats warning as WordPress.com shows it: the sentence, a link to the newest clean
 * backup, the "Known threats (N)" toggle with its list, and, on the restore screen, the checkbox.
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
	const toggle = useCallback( () => setOpen( previous => ! previous ), [] );
	const instanceId = useInstanceId( KnownThreatsWarning );
	const tableId = `jpb-known-threats-${ instanceId }`;
	const restoreInsteadHintId = `jpb-known-threats-restore-instead-${ instanceId }`;
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
			<p className="jpb-known-threats__message">
				<span className="jpb-known-threats__icon">
					<Icon icon={ cautionFilled } size={ 24 } />
				</span>
				<span>
					{ warning ||
						__(
							'This backup is known to contain security threats. Acknowledge them to restore it.',
							'jetpack-backup-pkg'
						) }
				</span>
			</p>
			{ flagged > 0 && ( rows.length > 0 || vulnerable > 0 ) && (
				<KnownThreatsToggle
					count={ flagged }
					open={ open }
					onToggle={ toggle }
					controls={ tableId }
				/>
			) }
			{ open && (
				<div id={ tableId } className="jpb-known-threats__table-wrap">
					{ rows.length > 0 && (
						<table
							className="jpb-known-threats__table"
							aria-label={ __( 'Known threats in this backup', 'jetpack-backup-pkg' ) }
						>
							<thead>
								<tr>
									<th scope="col">{ __( 'Threat', 'jetpack-backup-pkg' ) }</th>
									<th scope="col">{ __( 'Where', 'jetpack-backup-pkg' ) }</th>
									<th scope="col">{ __( 'First detected', 'jetpack-backup-pkg' ) }</th>
									<th scope="col">{ __( 'Status now', 'jetpack-backup-pkg' ) }</th>
								</tr>
							</thead>
							<tbody>
								{ rows.map( threat => (
									<tr key={ threat.id }>
										<td>{ threatName( threat ) }</td>
										<td>
											<bdi>{ where( threat ) }</bdi>
										</td>
										<td>{ localDate( threat.reported_on ) }</td>
										<td>{ statusNow( threat ) }</td>
									</tr>
								) ) }
							</tbody>
						</table>
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
				</div>
			) }
			{ showRestoreInstead && (
				// The tooltip gives the link no accessible description, so the hidden text does.
				<Tooltip.Root>
					<Tooltip.Trigger render={ <span className="jpb-known-threats__restore-instead-wrap" /> }>
						<Link
							className="jpb-known-threats__restore-instead"
							aria-describedby={ restoreInsteadHintId }
							render={
								<RouterLink to={ `/restore/${ restoreInsteadRewindId ?? restoreInsteadPeriod }` } />
							}
						>
							{ restoreInsteadRewindId
								? sprintf(
										/* translators: %s: a backup's date and time, e.g. "Oct 17, 2026 at 2:30 PM". */
										__( 'Restore %s backup instead', 'jetpack-backup-pkg' ),
										dateI18n(
											/* translators: date and time format, see https://www.php.net/manual/datetime.format.php */
											__( 'M j, Y \\a\\t g:i A', 'jetpack-backup-pkg' ),
											new Date( Number( restoreInsteadRewindId ) * 1000 ),
											undefined
										)
									)
								: __(
										'Restore the latest backup without known threats instead',
										'jetpack-backup-pkg'
									) }
						</Link>
						<VisuallyHidden id={ restoreInsteadHintId } render={ <span /> }>
							{ restoreInsteadHint }
						</VisuallyHidden>
					</Tooltip.Trigger>
					<Tooltip.Popup>{ restoreInsteadHint }</Tooltip.Popup>
				</Tooltip.Root>
			) }
			{ onAcknowledge && (
				<div className="jpb-known-threats__acknowledgement">
					<CheckboxControl
						__nextHasNoMarginBottom
						label={ __(
							'I understand this backup contains known threats and want to restore it anyway.',
							'jetpack-backup-pkg'
						) }
						checked={ acknowledged }
						onChange={ onAcknowledge }
					/>
				</div>
			) }
		</div>
	);
}
