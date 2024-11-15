import { Button } from '@automattic/jetpack-components';
import { Threat, getFixerAction } from '@automattic/jetpack-scan';
import { __ } from '@wordpress/i18n';
import React, { useMemo, useContext } from 'react';
import styles from './styles.module.scss';
import { ThreatDetailsModalContext } from '.';

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
	const { closeModal, onContinueClick } = useContext( ThreatDetailsModalContext );

	const fixerAction = useMemo( () => getFixerAction( threat ), [ threat ] );

	return (
		<div className={ styles[ 'modal-actions' ] }>
			<div className={ styles[ 'threat-actions' ] }>
				<Button variant="secondary" onClick={ closeModal }>
					{ __( 'Close', 'jetpack' ) }
				</Button>
			</div>
			<div className={ styles[ 'threat-actions' ] }>
				{ threat.status === 'ignored' && (
					<Button isDestructive={ true } variant="secondary" onClick={ onContinueClick }>
						{ __( 'Un-ignore', 'jetpack' ) }
					</Button>
				) }
				{ threat.status === 'current' && (
					<>
						<Button
							isDestructive={ true }
							variant="secondary"
							onClick={ onContinueClick }
							disabled={ fixerState.inProgress && ! fixerState.stale }
						>
							{ __( 'Ignore', 'jetpack' ) }
						</Button>

						{ threat.fixable && (
							<Button
								isPrimary
								disabled={ fixerState.inProgress && ! fixerState.stale }
								onClick={ onContinueClick }
							>
								{ fixerState.error || fixerState.stale
									? __( 'Retry fix', 'jetpack' )
									: fixerAction }
							</Button>
						) }
					</>
				) }
			</div>
		</div>
	);
};

export default ThreatDetailsActions;
