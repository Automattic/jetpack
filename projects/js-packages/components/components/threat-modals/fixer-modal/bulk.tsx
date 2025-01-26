import { getFixerDescription, THREAT_ACTION_FIX, ThreatsContext } from '@automattic/jetpack-scan';
import { _n, sprintf } from '@wordpress/i18n';
import { useCallback, useContext, useState } from 'react';
import Button from '../../button';
import ToggleControl from '../../toggle-control';
import CancelButton from '../cancel-button';
import styles from '../styles.module.scss';

/**
 * Threat Fixers Modal Content
 *
 * @param {object}   props                      - Component props.
 * @param {string[]} props.selectedThreatIds    - The selected threat IDs.
 * @param {Function} props.setSelectedThreatIds - The function to set the selected threat IDs.
 *
 * @return {JSX.Element} ThreatFixersModalContent Component.
 */
export default function ThreatFixersModalContent( { selectedThreatIds, setSelectedThreatIds } ) {
	const { actions, actionToConfirm, setActionToConfirm } = useContext( ThreatsContext );

	const [ isLoading, setIsLoading ] = useState( false );

	const onToggleAutoFix = useCallback(
		( threatId: string ) => () => {
			if ( selectedThreatIds.includes( threatId ) ) {
				setSelectedThreatIds( selectedThreatIds.filter( id => id !== threatId ) );
			} else {
				setSelectedThreatIds( [ ...selectedThreatIds, threatId ] );
			}
		},
		[ selectedThreatIds, setSelectedThreatIds ]
	);

	// Callback function for the fixer action.
	const onFixClick = useCallback( () => {
		const items = actionToConfirm.items.filter( item => selectedThreatIds.includes( item.id ) );

		setIsLoading( true );
		actions?.[ THREAT_ACTION_FIX ]?.callback( items, {
			onActionPerformed: () => {
				setIsLoading( false );
				setActionToConfirm( undefined );
			},
		} );
	}, [ actions, actionToConfirm.items, selectedThreatIds, setActionToConfirm ] );

	return (
		<>
			<div className={ styles[ 'threat-modal__content' ] }>
				<div className={ styles[ 'threat-modal__section' ] }>
					<div className={ styles.fixers }>
						{ actionToConfirm?.items.map( threat => (
							<div key={ threat.id } className={ styles.fixers__toggle }>
								<ToggleControl
									label={ threat.title }
									help={ getFixerDescription( threat ) }
									checked={ selectedThreatIds.includes( `${ threat.id }` ) }
									onChange={ onToggleAutoFix( `${ threat.id }` ) }
									size="small"
								/>
							</div>
						) ) }
					</div>
				</div>
			</div>
			<div className={ styles[ 'threat-modal__footer' ] }>
				<div className={ styles[ 'threat-modal__footer__actions' ] }>
					<CancelButton />
					<Button
						isPrimary
						disabled={ ! selectedThreatIds.length }
						onClick={ onFixClick }
						isLoading={ isLoading }
						key="fix"
					>
						{ sprintf(
							/* translators: placeholder is the number amount of threats, i.e. "Fix 12 threats". */
							_n(
								'Fix %s Threat',
								'Fix %s Threats',
								selectedThreatIds.length,
								'jetpack-components'
							),
							selectedThreatIds.length
						) }
					</Button>
				</div>
			</div>
		</>
	);
}
