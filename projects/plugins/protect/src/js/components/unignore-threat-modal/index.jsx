import { Button, Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import useUnIgnoreThreatMutation from '../../data/scan/use-unignore-threat-mutation';
import useFixers from '../../hooks/use-fixers';
import useModal from '../../hooks/use-modal';
import ThreatSeverityBadge from '../severity';
import UserConnectionGate from '../user-connection-gate';
import styles from './styles.module.scss';

const UnignoreThreatModal = ( { id, title, label, icon, severity } ) => {
	const { setModal } = useModal();
	const { fixersStatus } = useFixers();
	const unignoreThreatMutation = useUnIgnoreThreatMutation();
	const handleCancelClick = () => {
		return event => {
			event.preventDefault();
			setModal( { type: null } );
		};
	};

	const handleUnignoreClick = () => {
		return async event => {
			event.preventDefault();
			await unignoreThreatMutation.mutateAsync( id );
			setModal( { type: null } );
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
				<Button
					isDestructive={ true }
					isLoading={ Boolean( fixersStatus?.[ id ]?.status === 'in_progress' ) }
					onClick={ handleUnignoreClick() }
				>
					{ __( 'Unignore threat', 'jetpack-protect' ) }
				</Button>
			</div>
		</UserConnectionGate>
	);
};

export default UnignoreThreatModal;
