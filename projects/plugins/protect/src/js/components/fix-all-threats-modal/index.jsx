import { Button, Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo, useState } from 'react';
import useFixers from '../../hooks/use-fixers';
import useModal from '../../hooks/use-modal';
import ThreatFixHeader from '../threat-fix-header';
import UserConnectionGate from '../user-connection-gate';
import styles from './styles.module.scss';

const FixAllThreatsModal = ( { threatList = [] } ) => {
	const { setModal } = useModal();
	const { fixThreats, isLoading: isFixersLoading } = useFixers();

	const [ threatIds, setThreatIds ] = useState( threatList.map( ( { id } ) => parseInt( id ) ) );

	const handleCancelClick = useCallback(
		event => {
			event.preventDefault();
			setModal( { type: null } );
		},
		[ setModal ]
	);

	const handleFixClick = useCallback(
		async event => {
			event.preventDefault();

			await fixThreats( threatIds );
			setModal( { type: null } );
		},
		[ fixThreats, setModal, threatIds ]
	);

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

	const fixableThreats = useMemo(
		() =>
			threatList.filter(
				threat => threat.fixable && threat.fixable.extras?.isBulkFixable !== false
			),
		[ threatList ]
	);
	const nonFixableThreats = useMemo(
		() =>
			threatList.filter(
				threat => ! threat.fixable || threat.fixable.extras?.isBulkFixable === false
			),
		[ threatList ]
	);

	return (
		<UserConnectionGate>
			<Text variant="title-medium" mb={ 2 }>
				{ __( 'Fix all threats', 'jetpack-protect' ) }
			</Text>
			<Text mb={ 3 }>
				{ __( 'Jetpack will be fixing the selected threats:', 'jetpack-protect' ) }
			</Text>

			<div className={ styles.list }>
				{ fixableThreats.map( threat => (
					<ThreatFixHeader
						key={ threat.id }
						threat={ threat }
						fixAllDialog={ true }
						onCheckFix={ handleCheckboxClick }
					/>
				) ) }
			</div>

			<Text mb={ 3 } mr={ 6 }>
				{ __(
					'These threats cannot be fixed in bulk because individual confirmation is required:',
					'jetpack-protect'
				) }
			</Text>

			<div className={ styles.list }>
				{ nonFixableThreats.map( threat => (
					<ThreatFixHeader
						key={ threat.id }
						threat={ threat }
						fixAllDialog={ false }
						onCheckFix={ handleCheckboxClick }
					/>
				) ) }
			</div>

			<div className={ styles.footer }>
				<Button variant="secondary" onClick={ handleCancelClick }>
					{ __( 'Cancel', 'jetpack-protect' ) }
				</Button>
				<Button
					isLoading={ isFixersLoading }
					onClick={ handleFixClick }
					disabled={ ! threatIds.length }
				>
					{ __( 'Fix all threats', 'jetpack-protect' ) }
				</Button>
			</div>
		</UserConnectionGate>
	);
};

export default FixAllThreatsModal;
