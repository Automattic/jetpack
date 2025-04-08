import { Button, Text } from '@automattic/jetpack-components';
import { ThreatSeverityBadge } from '@automattic/jetpack-scan';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import { useState } from 'react';
import useUnIgnoreThreatMutation from '../../data/scan/use-unignore-threat-mutation';
import useModal from '../../hooks/use-modal';
import UserConnectionGate from '../user-connection-gate';
import styles from './styles.module.scss';

const UnignoreThreatModal = ( { id, title, label, icon, severity } ) => {
	const { setModal } = useModal();
	const unignoreThreatMutation = useUnIgnoreThreatMutation();
	const handleCancelClick = () => {
		return event => {
			event.preventDefault();
			setModal( { type: null } );
		};
	};

	const [ isUnignoring, setIsUnignoring ] = useState( false );

	const handleUnignoreClick = () => {
		return async event => {
			event.preventDefault();
			setIsUnignoring( true );
			await unignoreThreatMutation.mutateAsync( id );
			setModal( { type: null } );
			setIsUnignoring( false );
		};
	};

	return (
		<UserConnectionGate>
			<Text variant="title-medium" mb={ 2 }>
				{ __( 'Do you really want to unignore this threat?', 'jetpack-protect' ) }
			</Text>
			<Text mb={ 3 }>{ __( 'Jetpack will unignore the threat:', 'jetpack-protect' ) }</Text>

			<div className={ styles.threat }>
				<Icon icon={ icon } className={ styles.threat__icon } />
				<div className={ styles.threat__summary }>
					<Text className={ styles.threat__summary__label } mb={ 1 }>
						{ label }
					</Text>
					<Text className={ styles.threat__summary__title }>{ title }</Text>
				</div>
				<div className={ styles.threat__severity }>
					<ThreatSeverityBadge severity={ severity } />
				</div>
			</div>

			<div className={ styles.footer }>
				<Button variant="secondary" onClick={ handleCancelClick() }>
					{ __( 'Cancel', 'jetpack-protect' ) }
				</Button>
				<Button isDestructive={ true } isLoading={ isUnignoring } onClick={ handleUnignoreClick() }>
					{ __( 'Unignore threat', 'jetpack-protect' ) }
				</Button>
			</div>
		</UserConnectionGate>
	);
};

export default UnignoreThreatModal;
