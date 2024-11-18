import { Button } from '@automattic/jetpack-components';
import { Threat, getFixerAction } from '@automattic/jetpack-scan';
import { __ } from '@wordpress/i18n';
import React, { useCallback, useMemo, useContext } from 'react';
import { ThreatModalContext } from '../threats-data-views';
import styles from './styles.module.scss';

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
	const { closeModal, showThreatDetails, onShowThreatDetailsClick, onContinueClick } =
		useContext( ThreatModalContext );

	const fixerAction = useMemo( () => getFixerAction( threat ), [ threat ] );

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

	return (
		<div className={ styles[ 'modal-actions' ] }>
			<div className={ styles[ 'threat-actions' ] }>
				{ ! showThreatDetails && (
					<Button onClick={ onShowThreatDetailsClick }>
						{ __( 'Threat details', 'jetpack' ) }
					</Button>
				) }
				<Button variant="secondary" onClick={ closeModal }>
					{ __( 'Close', 'jetpack' ) }
				</Button>
			</div>
			<div className={ styles[ 'threat-actions' ] }>
				{ threat.status === 'ignored' && (
					<Button
						isDestructive={ true }
						variant="secondary"
						onClick={ handleUnignoreThreatClick ? onUnignoreClick : onContinueClick }
					>
						{ __( 'Un-ignore', 'jetpack' ) }
					</Button>
				) }
				{ threat.status === 'current' && (
					<>
						<Button
							isDestructive={ true }
							variant="secondary"
							onClick={ handleIgnoreThreatClick ? onIgnoreClick : onContinueClick }
							disabled={ fixerState.inProgress && ! fixerState.stale }
						>
							{ __( 'Ignore', 'jetpack' ) }
						</Button>
						{ threat.fixable && (
							<Button
								isPrimary
								disabled={ fixerState.inProgress && ! fixerState.stale }
								onClick={ handleFixThreatClick ? onFixClick : onContinueClick }
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

export default ThreatActions;
