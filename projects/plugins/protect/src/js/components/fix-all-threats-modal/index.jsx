import { Button, Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
import useFixersMutation from '../../data/scan/use-fixers-mutation';
import useModal from '../../hooks/use-modal';
import CredentialsGate from '../credentials-gate';
import ThreatFixHeader from '../threat-fix-header';
import UserConnectionGate from '../user-connection-gate';
import styles from './styles.module.scss';

const FixAllThreatsModal = ( { threatList = [] } ) => {
	const { setModal } = useModal();
	const fixersMutation = useFixersMutation();

	const [ threatIds, setThreatIds ] = useState( threatList.map( ( { id } ) => parseInt( id ) ) );

	const handleCancelClick = () => {
		return event => {
			event.preventDefault();
			setModal( { type: null } );
		};
	};

	const handleFixClick = () => {
		return async event => {
			event.preventDefault();

			await fixersMutation.mutateAsync( threatIds );
			setModal( { type: null } );
		};
	};

	const handleCheckboxClick = useCallback(
		( checked, threat ) => {
			if ( ! checked ) {
				setThreatIds( threatIds.filter( id => id !== threat.id ) );
			} else {
				setThreatIds( [ ...threatIds, threat.id ] );
			}
		},
		[ threatIds ]
	);

	return (
		<UserConnectionGate>
			<CredentialsGate>
				<Text variant="title-medium" mb={ 2 }>
					{ __( 'Fix all threats', 'jetpack-protect' ) }
				</Text>
				<Text mb={ 3 }>
					{ __( 'Jetpack will be fixing the selected threats:', 'jetpack-protect' ) }
				</Text>

				<div className={ styles.list }>
					{ threatList.map( threat => (
						<ThreatFixHeader
							key={ threat.id }
							threat={ threat }
							fixAllDialog={ true }
							onCheckFix={ handleCheckboxClick }
						/>
					) ) }
				</div>

				<div className={ styles.footer }>
					<Button variant="secondary" onClick={ handleCancelClick() }>
						{ __( 'Cancel', 'jetpack-protect' ) }
					</Button>
					<Button
						isLoading={ fixersMutation.isLoading }
						onClick={ handleFixClick() }
						disabled={ ! threatIds.length }
					>
						{ __( 'Fix all threats', 'jetpack-protect' ) }
					</Button>
				</div>
			</CredentialsGate>
		</UserConnectionGate>
	);
};

export default FixAllThreatsModal;
