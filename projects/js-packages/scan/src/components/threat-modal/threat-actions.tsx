import { Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useCallback, useContext, useMemo } from 'react';
import { getFixerState, getDetailedFixerAction } from '@automattic/jetpack-scan';
import FixerStateNotice from './fixer-state-notice.tsx';
import { ThreatModalContext } from './index.tsx';
import styles from './styles.module.scss';

/**
 * ThreatActions component
 *
 * @return {JSX.Element | null} The rendered action buttons or null if no actions are available.
 */
const ThreatActions = (): JSX.Element => {
	const {
		closeModal,
		threat,
		handleFixThreatClick,
		handleIgnoreThreatClick,
		handleUnignoreThreatClick,
		userConnectionNeeded,
		siteCredentialsNeeded,
	} = useContext( ThreatModalContext );
	const disabled = userConnectionNeeded || siteCredentialsNeeded;

	const fixerState = useMemo( () => {
		return getFixerState( threat.fixer );
	}, [ threat.fixer ] );

	const detailedFixerAction = useMemo( () => getDetailedFixerAction( threat ), [ threat ] );

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

	if ( ! threat?.status || threat.status === 'fixed' ) {
		return null;
	}

	return (
		<div className={ styles[ 'modal-footer' ] }>
			<FixerStateNotice fixerState={ fixerState } />
			<div className={ styles[ 'threat-actions' ] }>
				{ threat.status === 'ignored' && (
					<Button
						disabled={ disabled }
						isDestructive={ true }
						variant="secondary"
						onClick={ onUnignoreClick }
					>
						{ __( 'Un-ignore threat', 'jetpack-scan' ) }
					</Button>
				) }
				{ threat.status === 'current' && (
					<>
						<Button
							isDestructive={ true }
							variant="secondary"
							onClick={ onIgnoreClick }
							disabled={ disabled || ( fixerState.inProgress && ! fixerState.stale ) }
						>
							{ __( 'Ignore threat', 'jetpack-scan' ) }
						</Button>
						{ threat.fixable && (
							<Button
								isPrimary
								disabled={ disabled || ( fixerState.inProgress && ! fixerState.stale ) }
								onClick={ onFixClick }
							>
								{ fixerState.error || fixerState.stale
									? __( 'Retry fixer', 'jetpack-scan' )
									: detailedFixerAction }
							</Button>
						) }
					</>
				) }
			</div>
		</div>
	);
};

export default ThreatActions;
