import { Button } from '@automattic/jetpack-components';
import { Threat } from '@automattic/jetpack-scan';
import { __ } from '@wordpress/i18n';
import React, { useCallback, useContext } from 'react';
import styles from './styles.module.scss';
import { ThreatModalContext } from '.';

/**
 * ThreatActions component
 *
 * @param {object}   props                             - The component props.
 * @param {object}   props.threat                      - The threat object containing action details.
 * @param {object}   props.fixerState                  - The state of the fixer (inProgress, error, stale).
 * @param {boolean}  props.fixerState.inProgress       - Whether the fixer is in progress.
 * @param {boolean}  props.fixerState.error            - Whether the fixer encountered an error.
 * @param {boolean}  props.fixerState.stale            - Whether the fixer is stale.
 * @param {Function} [props.handleFixThreatClick]      - Function to handle fixing the threat.
 * @param {Function} [props.handleIgnoreThreatClick]   - Function to handle ignoring the threat.
 * @param {Function} [props.handleUnignoreThreatClick] - Function to handle unignoring the threat.
 *
 * @return {JSX.Element | null} The rendered action buttons or null if no actions are available.
 */
const ThreatActions = ( {
	threat,
	fixerState,
	handleFixThreatClick,
	handleIgnoreThreatClick,
	handleUnignoreThreatClick,
}: {
	threat: Threat;
	fixerState: { inProgress: boolean; error: boolean; stale: boolean };
	handleFixThreatClick?: ( threats: Threat[] ) => void;
	handleIgnoreThreatClick?: ( threats: Threat[] ) => void;
	handleUnignoreThreatClick?: ( threats: Threat[] ) => void;
} ): JSX.Element => {
	const { closeModal, actionToConfirm, onShowThreatDetailsClick } =
		useContext( ThreatModalContext );

	const onFixClick = useCallback( () => {
		handleFixThreatClick?.( [ threat ] );
		closeModal();
	}, [ threat, handleFixThreatClick, closeModal ] );

	const onIgnoreClick = useCallback( () => {
		handleIgnoreThreatClick?.( [ threat ] );
		closeModal();
	}, [ threat, handleIgnoreThreatClick, closeModal ] );

	const onUnignoreClick = useCallback( () => {
		handleUnignoreThreatClick?.( [ threat ] );
		closeModal();
	}, [ threat, handleUnignoreThreatClick, closeModal ] );

	if ( ! threat.status ) {
		return null;
	}

	return (
		<div className={ styles[ 'modal-actions' ] }>
			<Button variant="secondary" onClick={ onShowThreatDetailsClick }>
				{ __( 'Threat details', 'jetpack' ) }
			</Button>
			<div className={ styles[ 'threat-actions' ] }>
				{ threat.status === 'ignored' && actionToConfirm === 'un-ignore' && (
					<Button isDestructive={ true } variant="secondary" onClick={ onUnignoreClick }>
						{ __( 'Un-ignore threat', 'jetpack' ) }
					</Button>
				) }
				{ threat.status === 'current' && (
					<>
						{ actionToConfirm === 'ignore' && (
							<Button
								isDestructive={ true }
								variant="secondary"
								onClick={ onIgnoreClick }
								disabled={ fixerState.inProgress && ! fixerState.stale }
							>
								{ __( 'Ignore threat', 'jetpack' ) }
							</Button>
						) }
						{ threat.fixable && actionToConfirm === 'fix' && (
							<Button
								isPrimary
								disabled={ fixerState.inProgress && ! fixerState.stale }
								onClick={ onFixClick }
							>
								{ fixerState.error || fixerState.stale
									? __( 'Retry fixer', 'jetpack' )
									: __( 'Run fixer', 'jetpack' ) }
							</Button>
						) }
					</>
				) }
			</div>
		</div>
	);
};

export default ThreatActions;
