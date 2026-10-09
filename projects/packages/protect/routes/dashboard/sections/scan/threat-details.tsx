import { getFixerDescription, type Threat } from '@automattic/jetpack-scan';
import { dateI18n } from '@wordpress/date';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Badge, Button, Link, LinkButton, Stack, Text } from '@wordpress/ui';
import { DeleteSoftwareButton } from './delete-software';
import { getSoftwareActionLabels, getThreatLabel } from './labels';
import { THREAT_PARAM, useSearchParam } from './store';
import { fixThreat, ignoreThreat, unignoreThreat, useThreatAction } from './threat-actions';
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
 * How to resolve a threat: its fixer's description, the version that fixes it, or manual advice.
 *
 * @param threat - The threat.
 * @return The advice.
 */
function getResolution( threat: ScanThreat ): string {
	const fixer = threat.fixable && getFixerDescription( threat as Threat );
	if ( fixer ) {
		return sprintf(
			/* translators: %s describes the fix, such as "Update Contact Form 7 to version 6.2.1". */
			__( 'Jetpack Scan can fix this threat for you: %s.', 'jetpack-protect-pkg' ),
			fixer.replace( /\.$/, '' )
		);
	}
	if ( threat.fixedIn ) {
		return sprintf(
			/* translators: %s is a version number, such as "5.3.2". */
			__( 'Update to version %s or later.', 'jetpack-protect-pkg' ),
			threat.fixedIn
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
 * Ignore it, and Auto-fix it when Scan can, pinned to the bottom of the inspector.
 *
 * @param props        - Component props.
 * @param props.threat - The threat.
 * @return The footer.
 */
function ThreatFooter( { threat }: { threat: ScanThreat } ) {
	const { busy } = useThreatAction( threat.id );
	const isIgnored = threat.status === 'ignored';
	const [ , setThreat ] = useSearchParam( THREAT_PARAM );
	const open = useCallback( ( item: ScanThreat ) => setThreat( item.id ), [ setThreat ] );
	const onIgnore = useCallback( () => ignoreThreat( threat, open ), [ threat, open ] );
	const onUnignore = useCallback( () => unignoreThreat( threat, open ), [ threat, open ] );
	const onFix = useCallback( () => fixThreat( threat, open ), [ threat, open ] );

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
				<Stack direction="row" gap="sm" justify="space-between">
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
				<LinkButton href={ actions.update } variant="outline" size="compact">
					{ labels.update }
				</LinkButton>
			) }
			{ actions.deactivate && (
				<LinkButton href={ actions.deactivate } variant="outline" tone="neutral" size="compact">
					{ labels.deactivate }
				</LinkButton>
			) }
			<DeleteSoftwareButton threat={ threat } />
			{ actions.details && (
				<LinkButton
					href={ actions.details }
					variant="minimal"
					tone="neutral"
					size="compact"
					openInNewTab
				>
					{ __( 'View on WordPress.org', 'jetpack-protect-pkg' ) }
				</LinkButton>
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
	const file = threat.filename?.split( '/' ).pop();

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
					{ file
						? sprintf(
								/* translators: %s is a file name, such as "index.php". */
								__( 'File: %s', 'jetpack-protect-pkg' ),
								file
							)
						: kind && subject }
				</Text>
				<Stack direction="row" gap="xs" wrap="wrap">
					<SeverityBadge severity={ threat.severity } />
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

			{ ( threat.filename || threat.extension ) && (
				<Section title={ __( 'The technical details', 'jetpack-protect-pkg' ) }>
					{ threat.filename ? (
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
					) : (
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
					{ getResolution( threat ) }
				</Text>
				<SoftwareActions threat={ threat } />
			</Section>
			{ canAct && <ThreatFooter threat={ threat } /> }
		</div>
	);
}
