import { Button } from '@automattic/jetpack-components';
import { Threat, getDetailedFixerAction } from '@automattic/jetpack-scan';
import { __ } from '@wordpress/i18n';
import React, { useCallback, useMemo, useContext } from 'react';
import styles from './styles.module.scss';
import { ThreatModalContext } from '.';

/**
 * ThreatActions component
 *
 * @param {object}  props                       - The component props.
 * @param {object}  props.threat                - The threat object containing action details.
 * @param {object}  props.fixerState            - The state of the fixer (inProgress, error, stale).
 * @param {boolean} props.fixerState.inProgress - Whether the fixer is in progress.
 * @param {boolean} props.fixerState.error      - Whether the fixer encountered an error.
 * @param {boolean} props.fixerState.stale      - Whether the fixer is stale.
 *
 * @return {JSX.Element | null} The rendered action buttons or null if no actions are available.
 */
const ThreatDetailsActions = ( {
	threat,
	fixerState,
}: {
	threat: Threat;
	fixerState: { inProgress: boolean; error: boolean; stale: boolean };
} ): JSX.Element => {
	const { onHideThreatDetailsClick } = useContext( ThreatModalContext );

	const detailedFixerAction = useMemo( () => getDetailedFixerAction( threat ), [ threat ] );

	const onHideThreatDetails = useCallback(
		( action: string ) => {
			return () => {
				onHideThreatDetailsClick( action );
			};
		},
		[ onHideThreatDetailsClick ]
	);

	if ( ! threat.status ) {
		return null;
	}

	return (
		<div className={ styles[ 'modal-actions' ] }>
			<div className={ styles[ 'threat-actions' ] }>
				{ threat.status === 'ignored' && (
					<Button
						isDestructive={ true }
						variant="secondary"
						onClick={ onHideThreatDetails( 'un-ignore' ) }
					>
						{ __( 'Un-ignore threat', 'jetpack' ) }
					</Button>
				) }
				{ threat.status === 'current' && (
					<>
						<Button
							isDestructive={ true }
							variant="secondary"
							onClick={ onHideThreatDetails( 'ignore' ) }
							disabled={ fixerState.inProgress && ! fixerState.stale }
						>
							{ __( 'Ignore threat', 'jetpack' ) }
						</Button>
						{ threat.fixable && (
							<Button
								isPrimary
								disabled={ fixerState.inProgress && ! fixerState.stale }
								onClick={ onHideThreatDetails( 'fix' ) }
							>
								{ detailedFixerAction }
							</Button>
						) }
					</>
				) }
			</div>
		</div>
	);
};

export default ThreatDetailsActions;
