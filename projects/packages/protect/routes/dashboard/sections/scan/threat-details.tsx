import { getFixerDescription, type Threat } from '@automattic/jetpack-scan';
import { dateI18n } from '@wordpress/date';
import { Fragment, useCallback, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { AlertDialog, Badge, Button, ButtonLink, Link, Stack, Text } from '@wordpress/ui';
import useOpenThreat from '../use-open-threat';
import { DeleteSoftwareButton } from './delete-software';
import { getSoftwareActionLabels, getThreatLabel } from './labels';
import { THREAT_PARAM, useCanIgnore, useSearchParam } from './store';
import {
	deleteThreatRow,
	fixThreat,
	getThreatRow,
	ignoreThreat,
	unignoreThreat,
	useThreatAction,
	type ThreatRow,
} from './threat-actions';
import type { ScanThreat } from './types';
import type { ComponentProps, ReactNode } from 'react';

/**
 * The severity as a badge: "Critical severity", "High severity" or "Low severity".
 *
 * @param props          - Component props.
 * @param props.severity - The severity, 0 to 10.
 * @return The badge.
 */
function SeverityBadge( { severity = 0 }: { severity?: number } ) {
	let intent: ComponentProps< typeof Badge >[ 'intent' ] = 'draft';
	let label: string = __( 'Low severity', 'jetpack-protect-pkg' );
	if ( severity >= 5 ) {
		intent = 'high';
		label = __( 'Critical severity', 'jetpack-protect-pkg' );
	} else if ( severity >= 3 ) {
		intent = 'medium';
		label = __( 'High severity', 'jetpack-protect-pkg' );
	}
	return <Badge intent={ intent }>{ label }</Badge>;
}

/**
 * Whether the plugin or theme the threat is in is in use, as a badge.
 *
 * @param props        - Component props.
 * @param props.threat - The threat.
 * @return The badge, or null when the threat isn't in an installed plugin or theme.
 */
function StateBadge( { threat }: { threat: ScanThreat } ) {
	const { type, state } = threat.extension ?? {};
	if ( ! state ) {
		return null;
	}
	const isTheme = type === 'themes';
	const labels = {
		parent: __( 'Parent of active theme', 'jetpack-protect-pkg' ),
		active: isTheme
			? __( 'Active theme', 'jetpack-protect-pkg' )
			: __( 'Active plugin', 'jetpack-protect-pkg' ),
		inactive: isTheme
			? __( 'Inactive theme', 'jetpack-protect-pkg' )
			: __( 'Inactive plugin', 'jetpack-protect-pkg' ),
	};
	return (
		<Badge intent={ state === 'inactive' ? 'draft' : 'informational' }>{ labels[ state ] }</Badge>
	);
}

/**
 * Where a threat was found: its file, or its database table.
 *
 * @param threat - The threat.
 * @return "File: index.php" or "Table: wp_options", or empty when it's neither.
 */
function getLocation( threat: ScanThreat ): string {
	const file = threat.filename?.split( '/' ).pop();
	if ( file ) {
		/* translators: %s is a file name, such as "index.php". */
		return sprintf( __( 'File: %s', 'jetpack-protect-pkg' ), file );
	}
	if ( threat.database ) {
		/* translators: %s is a database table, such as "wp_options". */
		return sprintf( __( 'Table: %s', 'jetpack-protect-pkg' ), threat.database.table );
	}
	return '';
}

/**
 * How to resolve a threat: its fixer's description, the version that fixes it, or manual advice.
 *
 * @param threat    - The threat.
 * @param canDelete - Whether the threat's option can be deleted from the details.
 * @return The advice.
 */
function getResolution( threat: ScanThreat, canDelete: boolean ): string {
	const fixer = threat.fixable && getFixerDescription( threat as Threat );
	if ( fixer ) {
		return sprintf(
			/* translators: %s describes the fix, such as "Update Contact Form 7 to version 6.2.1". */
			__( 'Jetpack Scan can fix this threat for you: %s.', 'jetpack-protect-pkg' ),
			fixer.replace( /\.$/, '' )
		);
	}
	if ( threat.fixable ) {
		return __( 'Jetpack Scan can fix this threat for you.', 'jetpack-protect-pkg' );
	}
	if ( threat.fixedIn ) {
		return sprintf(
			/* translators: %s is a version number, such as "5.3.2". */
			__( 'Update to version %s or later.', 'jetpack-protect-pkg' ),
			threat.fixedIn
		);
	}
	if ( threat.database && canDelete ) {
		return __(
			'Jetpack Scan can’t fix this itself, but you can delete the option above if you don’t recognize it. Deleting can’t be undone, so check first that no plugin you use needs it, or contact Jetpack support for help.',
			'jetpack-protect-pkg'
		);
	}
	if ( threat.database ) {
		return sprintf(
			/* translators: %s is a database table, such as "wp_options". */
			__(
				'Jetpack can’t fix this automatically. If you don’t recognize the row above, remove it from the %s table, or contact Jetpack support for help.',
				'jetpack-protect-pkg'
			),
			threat.database.table
		);
	}
	return __(
		'Jetpack can’t fix this automatically. Review the affected code and remove it if you don’t recognize it, or contact Jetpack support for help.',
		'jetpack-protect-pkg'
	);
}

/**
 * A titled section of the details, divided from the next by a rule.
 *
 * @param props          - Component props.
 * @param props.title    - The section's heading.
 * @param props.children - The section's content.
 * @return The section.
 */
function Section( { title, children }: { title: string; children: ReactNode } ) {
	return (
		<Stack
			className="jp-protect-threat-details__section"
			direction="column"
			gap="md"
			render={ <section /> }
		>
			<Text variant="heading-md" render={ <h3 className="jp-protect-threat-details__heading" /> }>
				{ title }
			</Text>
			{ children }
		</Stack>
	);
}

/**
 * Delete the option a threat was found in, after a confirmation that says it can't be undone.
 *
 * @param props        - Component props.
 * @param props.threat - A database threat whose row is an option the dashboard may delete.
 * @param props.name   - The option's name.
 * @return The control.
 */
function DeleteOptionButton( { threat, name }: { threat: ScanThreat; name: string } ) {
	const [ , setThreat ] = useSearchParam( THREAT_PARAM );
	const onConfirm = useCallback( async () => {
		const error = await deleteThreatRow( threat );
		if ( error ) {
			return { error };
		}
		setThreat();
	}, [ threat, setThreat ] );
	const label = __( 'Delete option', 'jetpack-protect-pkg' );

	return (
		<Stack direction="column" gap="xs" align="start">
			<AlertDialog.Root onConfirm={ onConfirm }>
				<AlertDialog.Trigger render={ <Button variant="outline" tone="neutral" size="compact" /> }>
					{ label }
				</AlertDialog.Trigger>
				<AlertDialog.Popup
					intent="irreversible"
					title={ __( 'Delete option?', 'jetpack-protect-pkg' ) }
					description={ sprintf(
						/* translators: %s is an option name, such as "_wpc_ak". */
						__(
							'This permanently deletes the %s option from your database. Jetpack doesn’t keep a copy, so it can’t be undone. If a plugin you use needs this option, that plugin may stop working.',
							'jetpack-protect-pkg'
						),
						name
					) }
					confirmButtonText={ label }
				/>
			</AlertDialog.Root>
			<Text variant="body-sm" className="jp-protect-card__muted">
				{ __( 'Deleting can’t be undone.', 'jetpack-protect-pkg' ) }
			</Text>
		</Stack>
	);
}

/**
 * Read the database row a current database threat was found in, from the site.
 *
 * @param threat - The threat.
 * @param canAct - Whether the site's plan can act on threats, which reading the row needs.
 * @return The row once read, and why it couldn't be.
 */
function useThreatRow( threat: ScanThreat, canAct: boolean ) {
	const [ row, setRow ] = useState< ThreatRow | null >( null );
	const [ rowError, setRowError ] = useState< string | null >( null );
	const canRead = canAct && threat.status === 'current' && !! threat.database;

	useEffect( () => {
		setRow( null );
		setRowError( null );
		if ( ! canRead ) {
			return;
		}
		let isCurrent = true;
		getThreatRow( threat )
			.then( next => isCurrent && setRow( next ) )
			.catch( ( e: { message?: string } ) => isCurrent && setRowError( e?.message ?? null ) );
		return () => {
			isCurrent = false;
		};
		// Refetch per threat, not per render of the same threat.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ threat.id, canRead ] );

	return { row, rowError };
}

/**
 * The database row a threat was found in: Scan's key and columns, then the whole row once the site returns it.
 *
 * @param props          - Component props.
 * @param props.threat   - A database threat.
 * @param props.row      - The row, once read from the site.
 * @param props.rowError - Why the row couldn't be read.
 * @return The row.
 */
function DatabaseRow( {
	threat,
	row,
	rowError,
}: {
	threat: ScanThreat;
	row: ThreatRow | null;
	rowError: string | null;
} ) {
	const database = threat.database as NonNullable< ScanThreat[ 'database' ] >;
	const fields: [ string, unknown ][] = row
		? Object.entries( row.columns )
		: [
				...( database.pkColumn
					? [ [ database.pkColumn, database.pkValue ] as [ string, unknown ] ]
					: [] ),
				...Object.entries( database.details ?? {} ),
			];
	const optionName = row?.canDelete ? row.columns.option_name : null;

	return (
		<>
			<Text variant="body-md" className="jp-protect-card__muted">
				{ sprintf(
					/* translators: %s is a database table, such as "wp_options". */
					__( 'Threat found in the %s table, in this row:', 'jetpack-protect-pkg' ),
					database.table
				) }
			</Text>
			{ fields.length > 0 && (
				<dl className="jp-protect-threat-details__code jp-protect-threat-details__fields">
					{ fields.map( ( [ column, value ] ) => (
						<Fragment key={ column }>
							<dt>{ column }</dt>
							<dd>{ typeof value === 'string' ? value : JSON.stringify( value ) }</dd>
						</Fragment>
					) ) }
				</dl>
			) }
			{ rowError && (
				<Text variant="body-sm" className="jp-protect-card__muted">
					{ rowError }
				</Text>
			) }
			{ typeof optionName === 'string' && (
				<DeleteOptionButton threat={ threat } name={ optionName } />
			) }
		</>
	);
}

/**
 * Ignore it, and Auto-fix it when Scan can, pinned to the bottom of the inspector.
 *
 * @param props        - Component props.
 * @param props.threat - The threat.
 * @return The footer.
 */
function ThreatFooter( { threat }: { threat: ScanThreat } ) {
	const { busy } = useThreatAction( threat.id );
	const isIgnored = threat.status === 'ignored';
	const canIgnore = useCanIgnore();
	const open = useOpenThreat();
	const onIgnore = useCallback( () => ignoreThreat( threat, open ), [ threat, open ] );
	const onUnignore = useCallback( () => unignoreThreat( threat, open ), [ threat, open ] );
	const onFix = useCallback( () => fixThreat( threat, open ), [ threat, open ] );

	if ( ! canIgnore && ! isIgnored && ! threat.fixable ) {
		return null;
	}

	return (
		<div className="jp-protect-threat-details__footer">
			{ busy === 'fixing' && (
				<Text variant="body-sm" className="jp-protect-card__muted">
					{ __(
						'Jetpack is fixing this threat. You can close this panel; the list updates when it’s done.',
						'jetpack-protect-pkg'
					) }
				</Text>
			) }
			{ isIgnored ? (
				<Button
					variant="outline"
					onClick={ onUnignore }
					loading={ busy === 'unignoring' }
					disabled={ !! busy }
				>
					{ __( 'Unignore it', 'jetpack-protect-pkg' ) }
				</Button>
			) : (
				<Stack direction="row" gap="sm" justify={ canIgnore ? 'space-between' : 'end' }>
					{ canIgnore && (
						<Button
							className="jp-protect-threat-details__ignore"
							variant="minimal"
							tone="neutral"
							onClick={ onIgnore }
							loading={ busy === 'ignoring' }
							disabled={ !! busy }
						>
							{ __( 'Ignore it', 'jetpack-protect-pkg' ) }
						</Button>
					) }
					{ threat.fixable && (
						<Button onClick={ onFix } loading={ busy === 'fixing' } disabled={ !! busy }>
							{ busy === 'fixing'
								? __( 'Fixing…', 'jetpack-protect-pkg' )
								: __( 'Auto-fix it', 'jetpack-protect-pkg' ) }
						</Button>
					) }
				</Stack>
			) }
		</div>
	);
}

/**
 * Links that act on the affected software: update it, deactivate it, or look it up.
 *
 * @param props        - Component props.
 * @param props.threat - The threat.
 * @return The links, or null when there are none.
 */
function SoftwareActions( { threat }: { threat: ScanThreat } ) {
	const actions = threat.extension?.actions ?? {};
	if ( ! actions.update && ! actions.deactivate && ! actions.delete && ! actions.details ) {
		return null;
	}

	const labels = getSoftwareActionLabels( threat );

	return (
		<Stack direction="row" gap="sm" wrap="wrap">
			{ actions.update && (
				<ButtonLink href={ actions.update } variant="outline" size="compact">
					{ labels.update }
				</ButtonLink>
			) }
			{ actions.deactivate && (
				<ButtonLink href={ actions.deactivate } variant="outline" tone="neutral" size="compact">
					{ labels.deactivate }
				</ButtonLink>
			) }
			<DeleteSoftwareButton threat={ threat } />
			{ actions.details && (
				<ButtonLink
					href={ actions.details }
					variant="minimal"
					tone="neutral"
					size="compact"
					openInNewTab
				>
					{ __( 'View on WordPress.org', 'jetpack-protect-pkg' ) }
				</ButtonLink>
			) }
		</Stack>
	);
}

/**
 * Everything known about one threat, for the inspector.
 *
 * @param props        - Component props.
 * @param props.threat - The threat.
 * @param props.canAct - Whether the site's plan can fix and ignore threats.
 * @return The details.
 */
export default function ThreatDetails( {
	threat,
	canAct,
}: {
	threat: ScanThreat;
	canAct: boolean;
} ) {
	const { kind, subject } = getThreatLabel( threat );
	const vulnerabilities = threat.vulnerabilities ?? [];
	const context = threat.context ?? [];
	const { row, rowError } = useThreatRow( threat, canAct );

	return (
		<div className="jp-protect-threat-details">
			<Stack
				className="jp-protect-threat-details__section"
				direction="column"
				gap="sm"
				align="start"
			>
				<Text variant="heading-xl" render={ <h3 className="jp-protect-threat-details__heading" /> }>
					{ kind || subject }
				</Text>
				<Text variant="body-md" className="jp-protect-card__muted">
					{ getLocation( threat ) || ( kind && subject ) }
				</Text>
				<Stack direction="row" gap="xs" wrap="wrap">
					<SeverityBadge severity={ threat.severity } />
					{ threat.status !== 'fixed' && <StateBadge threat={ threat } /> }
					{ threat.status === 'ignored' && (
						<Badge intent="informational">{ __( 'Ignored', 'jetpack-protect-pkg' ) }</Badge>
					) }
					{ threat.status === 'fixed' && (
						<Badge intent="stable">{ __( 'Fixed', 'jetpack-protect-pkg' ) }</Badge>
					) }
				</Stack>
				{ threat.status === 'fixed' && threat.fixedOn && (
					<Text variant="body-sm" className="jp-protect-card__muted">
						{ sprintf(
							/* translators: %s is a date, such as "Aug 15, 7:00 AM". */
							__( 'Jetpack fixed this threat on %s.', 'jetpack-protect-pkg' ),
							dateI18n( 'M j, Y, g:i A', threat.fixedOn, undefined )
						) }
					</Text>
				) }
				{ threat.status === 'ignored' && (
					<Text variant="body-sm" className="jp-protect-card__muted">
						{ __(
							'You ignored this threat, so Scan no longer reports it. Unignore it to have Scan check it again.',
							'jetpack-protect-pkg'
						) }
					</Text>
				) }
			</Stack>

			<Section title={ __( 'What did Jetpack find?', 'jetpack-protect-pkg' ) }>
				{ threat.description && (
					<Text variant="body-md" className="jp-protect-card__muted">
						{ threat.description }
					</Text>
				) }
				{ vulnerabilities.length > 0 && (
					<ul className="jp-protect-threat-details__list">
						{ vulnerabilities.map( vulnerability => (
							<li key={ vulnerability.id ?? vulnerability.title }>
								<Text variant="body-md">{ vulnerability.title }</Text>
								{ vulnerability.source && (
									<Link href={ vulnerability.source } openInNewTab>
										{ __( 'Learn more', 'jetpack-protect-pkg' ) }
									</Link>
								) }
							</li>
						) ) }
					</ul>
				) }
				{ ! vulnerabilities.length && threat.source && (
					<Link href={ threat.source } openInNewTab>
						{ __( 'Learn more about this vulnerability', 'jetpack-protect-pkg' ) }
					</Link>
				) }
			</Section>

			{ ( threat.filename || threat.extension || threat.database ) && (
				<Section title={ __( 'The technical details', 'jetpack-protect-pkg' ) }>
					{ threat.database && ! threat.filename && (
						<DatabaseRow threat={ threat } row={ row } rowError={ rowError } />
					) }
					{ threat.filename && (
						<>
							<Text variant="body-md" className="jp-protect-card__muted">
								{ __( 'Threat found in file:', 'jetpack-protect-pkg' ) }
							</Text>
							<pre className="jp-protect-threat-details__code">{ threat.filename }</pre>
							{ context.length > 0 && (
								<pre className="jp-protect-threat-details__code">
									{ context.map( ( { line, code } ) => (
										<span key={ line } className="jp-protect-threat-details__line">
											<span className="jp-protect-threat-details__line-number">{ line }</span>
											{ code }
										</span>
									) ) }
								</pre>
							) }
						</>
					) }
					{ ! threat.filename && ! threat.database && (
						<Text variant="body-md" className="jp-protect-card__muted">
							{ threat.fixedIn
								? sprintf(
										/* translators: 1: a plugin or theme, such as "Contact Form 7 (5.3.1)". 2: a version number. */
										__( '%1$s is affected. Version %2$s fixes it.', 'jetpack-protect-pkg' ),
										subject,
										threat.fixedIn
									)
								: sprintf(
										/* translators: %s is a plugin or theme, such as "Contact Form 7 (5.3.1)". */
										__( '%s is affected.', 'jetpack-protect-pkg' ),
										subject
									) }
						</Text>
					) }
				</Section>
			) }

			<Section title={ __( 'How to resolve or handle this detection?', 'jetpack-protect-pkg' ) }>
				<Text variant="body-md" className="jp-protect-card__muted">
					{ getResolution( threat, !! row?.canDelete ) }
				</Text>
				<SoftwareActions threat={ threat } />
			</Section>
			{ canAct && <ThreatFooter threat={ threat } /> }
		</div>
	);
}
