import { Button, Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import useFixers from '../../hooks/use-fixers';
import useModal from '../../hooks/use-modal';
import CredentialsGate from '../credentials-gate';
import ThreatFixHeader from '../threat-fix-header';
import UserConnectionGate from '../user-connection-gate';
import styles from './styles.module.scss';

const FixThreatModal = ( { id, fixable, label, icon, severity } ) => {
	const { setModal } = useModal();
	const { fixThreats, isLoading: isFixersLoading } = useFixers();

	const handleCancelClick = () => {
		return event => {
			event.preventDefault();
			setModal( { type: null } );
		};
	};

	const handleFixClick = () => {
		return async event => {
			event.preventDefault();
			await fixThreats( [ id ] );
			setModal( { type: null } );
		};
	};

	return (
		<UserConnectionGate>
			<CredentialsGate>
				<Text variant="title-medium" mb={ 2 }>
					{ __( 'Fix Threat', 'jetpack-protect' ) }
				</Text>
				<Text mb={ 3 }>
					{ __( 'Jetpack will be fixing the selected threat:', 'jetpack-protect' ) }
				</Text>

				<div className={ styles.list }>
					<ThreatFixHeader
						threat={ { id, fixable, label, icon, severity } }
						fixAllDialog={ false }
					/>
				</div>

				<div className={ styles.footer }>
					<Button variant="secondary" onClick={ handleCancelClick() }>
						{ __( 'Cancel', 'jetpack-protect' ) }
					</Button>
					<Button isLoading={ isFixersLoading } onClick={ handleFixClick() }>
						{ __( 'Fix threat', 'jetpack-protect' ) }
					</Button>
				</div>
			</CredentialsGate>
		</UserConnectionGate>
	);
};

export default FixThreatModal;
