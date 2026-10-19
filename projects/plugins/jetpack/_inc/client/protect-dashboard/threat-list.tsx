import {
	useFixThreatsMutation,
	useIgnoreThreatMutation,
	useUnignoreThreatMutation,
} from '@automattic/jetpack-scan-page/src/js/data/use-threat-mutations';
import { Button, Icon } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { Link } from '@wordpress/ui';
import type { Threat } from '@automattic/jetpack-scan-page/src/js/data/types';
import type { FC } from 'react';

const formatDate = ( iso?: string ) =>
	iso ? new Date( iso ).toLocaleDateString( undefined, { dateStyle: 'long' } ) : '';

/**
 * Severity pill, using the same bands as Jetpack Scan's badge.
 *
 * @param props          - Component props.
 * @param props.severity - Threat severity score.
 * @return The badge.
 */
const SeverityBadge: FC< { severity?: number } > = ( { severity = 0 } ) => {
	if ( severity >= 5 ) {
		return (
			<span className="jp-protect-threat__severity is-critical">
				{ _x( 'Critical', 'Threat severity', 'jetpack' ) }
			</span>
		);
	}
	if ( severity >= 3 ) {
		return (
			<span className="jp-protect-threat__severity is-high">
				{ _x( 'High', 'Threat severity', 'jetpack' ) }
			</span>
		);
	}
	return (
		<span className="jp-protect-threat__severity is-low">
			{ _x( 'Low', 'Threat severity', 'jetpack' ) }
		</span>
	);
};

/**
 * Fix / ignore / unignore buttons for one threat.
 *
 * @param props        - Component props.
 * @param props.threat - The threat.
 * @return The actions.
 */
const ThreatActions: FC< { threat: Threat } > = ( { threat } ) => {
	const fix = useFixThreatsMutation();
	const ignore = useIgnoreThreatMutation();
	const unignore = useUnignoreThreatMutation();
	const onFix = useCallback( () => fix.mutate( [ threat.id ] ), [ fix, threat.id ] );
	const onIgnore = useCallback( () => ignore.mutate( threat.id ), [ ignore, threat.id ] );
	const onUnignore = useCallback( () => unignore.mutate( threat.id ), [ unignore, threat.id ] );

	if ( threat.status === 'ignored' ) {
		return (
			<div className="jp-protect-threat__actions">
				<Button variant="secondary" isBusy={ unignore.isPending } onClick={ onUnignore }>
					{ __( 'Unignore threat', 'jetpack' ) }
				</Button>
			</div>
		);
	}
	if ( threat.status !== 'current' ) {
		return null;
	}
	return (
		<div className="jp-protect-threat__actions">
			{ threat.fixable && (
				<Button variant="primary" isBusy={ fix.isPending } onClick={ onFix }>
					{ __( 'Fix threat', 'jetpack' ) }
				</Button>
			) }
			<Button variant="secondary" isBusy={ ignore.isPending } onClick={ onIgnore }>
				{ __( 'Ignore threat', 'jetpack' ) }
			</Button>
		</div>
	);
};

/**
 * One expandable threat row.
 *
 * @param props         - Component props.
 * @param props.threat  - The threat.
 * @param props.showFix - Whether to show the Auto fix column.
 * @return The row.
 */
const ThreatRow: FC< { threat: Threat; showFix: boolean } > = ( { threat, showFix } ) => {
	const [ open, setOpen ] = useState( false );
	const toggle = useCallback( () => setOpen( value => ! value ), [] );

	return (
		<li className="jp-protect-threat">
			<Button className="jp-protect-threat__summary" aria-expanded={ open } onClick={ toggle }>
				<span className="jp-protect-threat__severity-cell">
					<SeverityBadge severity={ threat.severity } />
				</span>
				<span className="jp-protect-threat__details">
					<span className="jp-protect-threat__title">{ threat.title }</span>
					<span className="jp-protect-threat__meta">
						{ sprintf(
							/* translators: %s is a date. */
							__( 'Threat found on %s', 'jetpack' ),
							formatDate( threat.firstDetected )
						) }
						{ threat.status === 'fixed' && threat.fixedOn && (
							<span className="jp-protect-threat__fixed-on">
								{ sprintf(
									/* translators: %s is a date. */
									__( 'Threat fixed on %s', 'jetpack' ),
									formatDate( threat.fixedOn )
								) }
							</span>
						) }
					</span>
					{ threat.status === 'fixed' && (
						<span className="jp-protect-threat__status is-fixed">{ __( 'Fixed', 'jetpack' ) }</span>
					) }
					{ threat.status === 'ignored' && (
						<span className="jp-protect-threat__status is-ignored">
							{ __( 'Ignored', 'jetpack' ) }
						</span>
					) }
				</span>
				{ showFix && (
					<span className="jp-protect-threat__fix">
						{ threat.fixable ? __( 'Yes', 'jetpack' ) : '—' }
					</span>
				) }
				<Icon icon={ open ? chevronUp : chevronDown } className="jp-protect-threat__chevron" />
			</Button>
			{ open && (
				<div className="jp-protect-threat__body">
					<h3>{ __( 'What did Jetpack find?', 'jetpack' ) }</h3>
					<p>{ threat.description }</p>
					{ threat.filename && <code>{ threat.filename }</code> }
					{ threat.source && (
						<Link href={ threat.source } openInNewTab>
							{ __( 'Learn more about this vulnerability', 'jetpack' ) }
						</Link>
					) }
					<ThreatActions threat={ threat } />
				</div>
			) }
		</li>
	);
};

type Props = {
	threats: Threat[];
	showFix?: boolean;
};

/**
 * Threat table: severity, details, optional Auto fix column, expandable details.
 *
 * @param props         - Component props.
 * @param props.threats - Threats to list, most severe first.
 * @param props.showFix - Whether to show the Auto fix column.
 * @return The list.
 */
const ThreatList: FC< Props > = ( { threats, showFix = false } ) => (
	<div className={ `jp-protect-threats${ showFix ? ' has-fix' : '' }` }>
		<div className="jp-protect-threats__header" aria-hidden="true">
			<span className="jp-protect-threat__severity-cell">{ __( 'Severity', 'jetpack' ) }</span>
			<span className="jp-protect-threat__details">{ __( 'Details', 'jetpack' ) }</span>
			{ showFix && <span className="jp-protect-threat__fix">{ __( 'Auto fix', 'jetpack' ) }</span> }
			<span className="jp-protect-threat__chevron" />
		</div>
		<ul>
			{ [ ...threats ]
				.sort( ( a, b ) => ( b.severity ?? 0 ) - ( a.severity ?? 0 ) )
				.map( threat => (
					<ThreatRow key={ threat.id } threat={ threat } showFix={ showFix } />
				) ) }
		</ul>
	</div>
);

export default ThreatList;
