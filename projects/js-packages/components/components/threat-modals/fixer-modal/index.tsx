import { ThreatsContext } from '@automattic/jetpack-scan';
import { Modal } from '@wordpress/components';
import { _n } from '@wordpress/i18n';
import { useContext, useMemo, useState } from 'react';
import ThreatFixersModalContent from './bulk';
import ConnectionNeededContent from './connection';
import CredentialsNeededContent from './credentials';
import { ThreatFixerModalContent } from './single';

/**
 * Threat Fixer Modal Content
 *
 * @param {object} props - Component props.
 *
 * @return {JSX.Element} ThreatFixerModalContent Component.
 */
export default function ThreatFixerModal(
	props: React.ComponentProps< typeof Modal >
): JSX.Element {
	const { actionToConfirm, connection, credentials } = useContext( ThreatsContext );

	const threats = actionToConfirm?.items || [];
	const [ selectedThreatIds, setSelectedThreatIds ] = useState< string[] >(
		actionToConfirm?.items.map( item => `${ item.id }` ) || []
	);

	const modal = useMemo( () => {
		if ( ! connection.connected ) {
			return <ConnectionNeededContent />;
		}

		if ( ! credentials.available ) {
			return <CredentialsNeededContent />;
		}

		if ( actionToConfirm?.items.length > 1 ) {
			return (
				<ThreatFixersModalContent
					selectedThreatIds={ selectedThreatIds }
					setSelectedThreatIds={ setSelectedThreatIds }
				/>
			);
		}

		return <ThreatFixerModalContent />;
	}, [
		actionToConfirm?.items.length,
		connection.connected,
		credentials.available,
		selectedThreatIds,
	] );

	return (
		<Modal
			title={ _n( 'Auto-Fix Threat', 'Auto-Fix Threats', threats.length, 'jetpack-components' ) }
			focusOnMount={ false }
			{ ...props }
		>
			{ modal }
		</Modal>
	);
}
