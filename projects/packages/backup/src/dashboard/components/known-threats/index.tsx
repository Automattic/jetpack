import { CheckboxControl } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useCallback, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Button, Notice, Stack, Text } from '@wordpress/ui';
import { formatDate } from '../../data/date-format';
import './style.scss';
import type { KnownThreat, KnownThreats } from '../../data/api/known-threats';

type Props = {
	/** What the screen knows about the backup's threats; null when unavailable. */
	threats: KnownThreats | null;
	acknowledged: boolean;
	onAcknowledge: ( next: boolean ) => void;
};

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
		return threat.fixed_on
			? sprintf(
					/* translators: %s: the date the threat was fixed. */
					__( 'Fixed %s', 'jetpack-backup-pkg' ),
					formatDate( threat.fixed_on )
				)
			: __( 'Fixed', 'jetpack-backup-pkg' );
	}
	if ( threat.status === 'ignored' ) {
		return __( 'Ignored', 'jetpack-backup-pkg' );
	}
	return __( 'Open', 'jetpack-backup-pkg' );
}

/**
 * The known-threats warning, its threat list and the acknowledgement checkbox.
 *
 * This screen is where the acknowledgement happens. Also rendered after the edge case of a
 * server-side refusal over threats the screen did not know about, when `threats` may be null.
 *
 * @param props               - Component props.
 * @param props.threats       - What the screen knows about the backup's threats.
 * @param props.acknowledged  - Whether the checkbox is ticked.
 * @param props.onAcknowledge - Called with the checkbox's new value.
 * @return The rendered warning.
 */
export default function KnownThreatsWarning( { threats, acknowledged, onAcknowledge }: Props ) {
	const [ open, setOpen ] = useState( false );
	const toggle = useCallback( () => setOpen( previous => ! previous ), [] );
	const tableId = `jpb-known-threats-${ useInstanceId( KnownThreatsWarning ) }`;
	const flagged = threats?.summary.flagged ?? 0;
	const vulnerable = threats?.summary.vulnerable ?? 0;
	const listed = threats?.threats.length ?? 0;
	const truncated = !! threats && ( threats.truncated || threats.count > listed );
	const rows = ( threats?.threats ?? [] ).filter(
		threat => threat.kind === 'malware' || threat.kind === 'database'
	);

	return (
		<Stack direction="column" gap="sm" className="jpb-known-threats">
			<Notice.Root intent="warning">
				<Notice.Description>
					{ flagged > 0
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
						: __(
								'This backup is known to contain security threats. Acknowledge them to restore it.',
								'jetpack-backup-pkg'
							) }
				</Notice.Description>
			</Notice.Root>
			{ ( rows.length > 0 || vulnerable > 0 ) && (
				<Button
					className="jpb-known-threats__toggle"
					variant="minimal"
					aria-expanded={ open }
					aria-controls={ tableId }
					onClick={ toggle }
				>
					{ open
						? __( 'Hide threats', 'jetpack-backup-pkg' )
						: __( 'Show threats', 'jetpack-backup-pkg' ) }
				</Button>
			) }
			{ open && (
				<div id={ tableId } className="jpb-known-threats__table-wrap">
					{ rows.length > 0 && (
						<table className="jpb-known-threats__table">
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
										<td>{ threat.signature }</td>
										<td>
											<bdi>{ where( threat ) }</bdi>
										</td>
										<td>{ threat.reported_on ? formatDate( threat.reported_on ) : '' }</td>
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
			<CheckboxControl
				__nextHasNoMarginBottom
				label={ __(
					'I understand this backup contains known threats and want to restore it anyway.',
					'jetpack-backup-pkg'
				) }
				checked={ acknowledged }
				onChange={ onAcknowledge }
			/>
		</Stack>
	);
}
