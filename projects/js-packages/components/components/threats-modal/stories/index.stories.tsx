import { useCallback, useState } from 'react';
import Button from '../../button/index.js';
import ThreatsModal from '../index.js';

export default {
	title: 'JS Packages/Components/Threats Modal',
	component: ThreatsModal,
};

const Base = args => {
	const [ isOpen, setIsOpen ] = useState( false );
	const onClick = useCallback( () => setIsOpen( true ), [] );
	const onRequestClose = useCallback( () => setIsOpen( false ), [] );

	return (
		<div>
			<Button onClick={ onClick }>Open Threats Modal</Button>
			{ isOpen ? (
				<ThreatsModal
					currentThreats={ [
						{
							id: 185869885,
							signature: 'EICAR_AV_Test',
							title: 'Malicious code found in file: index.php',
							description:
								"This is the standard EICAR antivirus test code, and not a real infection. If your site contains this code when you don't expect it to, contact Jetpack support for some help.",
							firstDetected: '2024-10-07T20:45:06.000Z',
							fixedIn: null,
							severity: 8,
							fixable: {
								fixer: 'rollback',
								target: 'January 26, 2024, 6:49 am',
								extensionStatus: '',
							},
							fixer: { status: 'not_started' },
							status: 'current',
							filename: '/var/www/html/wp-content/index.php',
							context: {
								'1': 'echo <<<HTML',
								'2': 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*',
								'3': 'HTML;',
								marks: {},
							},
						},
						{
							id: 185869886,
							signature: 'EICAR_AV_Test',
							title: 'Malicious code found in file: index.php',
							description:
								"This is the standard EICAR antivirus test code, and not a real infection. If your site contains this code when you don't expect it to, contact Jetpack support for some help.",
							firstDetected: '2024-10-07T20:45:06.000Z',
							fixedIn: null,
							severity: 8,
							fixable: {
								fixer: 'rollback',
								target: 'January 26, 2024, 6:49 am',
								extensionStatus: '',
							},
							fixer: { status: 'not_started' },
							status: 'current',
							filename: '/var/www/html/wp-content/index.php',
							context: {
								'1': 'echo <<<HTML',
								'2': 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*',
								'3': 'HTML;',
								marks: {},
							},
						},
					] }
					onRequestClose={ onRequestClose }
					actionToConfirm={ 'all' }
					{ ...args }
				/>
			) : null }
		</div>
	);
};

export const ThreatResult = Base.bind( {} );
ThreatResult.args = {
	currentThreats: [
		{
			id: 185869885,
			signature: 'EICAR_AV_Test',
			title: 'Malicious code found in file: index.php',
			description:
				"This is the standard EICAR antivirus test code, and not a real infection. If your site contains this code when you don't expect it to, contact Jetpack support for some help.",
			firstDetected: '2024-10-07T20:45:06.000Z',
			fixedIn: null,
			severity: 8,
			fixable: {
				fixer: 'rollback',
				target: 'January 26, 2024, 6:49 am',
				extensionStatus: '',
			},
			fixer: { status: 'not_started' },
			status: 'current',
			filename: '/var/www/html/wp-content/index.php',
			context: {
				'1': 'echo <<<HTML',
				'2': 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*',
				'3': 'HTML;',
				marks: {},
			},
		},
	],
	isUserConnected: true,
	hasConnectedOwner: true,
	credentials: [ { type: 'managed', role: 'main', still_valid: true } ],
	handleFixThreatClick: () => {},
	handleIgnoreThreatClick: () => {},
	handleUnignoreThreatClick: () => {},
};

export const ThreatsResult = Base.bind( {} );
ThreatsResult.args = {
	isUserConnected: true,
	hasConnectedOwner: true,
	credentials: [ { type: 'managed', role: 'main', still_valid: true } ],
	handleFixThreatClick: () => {},
	handleIgnoreThreatClick: () => {},
	handleUnignoreThreatClick: () => {},
};

export const AdditionalConnectionsNeeded = Base.bind( {} );
AdditionalConnectionsNeeded.args = {
	isUserConnected: false,
	hasConnectedOwner: false,
	credentials: false,
	credentialsRedirectUrl: '#',
	handleConnectUser: () => {},
	handleFixThreatClick: () => {},
	handleIgnoreThreatClick: () => {},
	handleUnignoreThreatClick: () => {},
};

export const UserConnectionNeeded = Base.bind( {} );
UserConnectionNeeded.args = {
	isUserConnected: false,
	hasConnectedOwner: false,
	handleConnectUser: () => {},
	credentials: [ { type: 'managed', role: 'main', still_valid: true } ],
	credentialsRedirectUrl: '#',
	handleFixThreatClick: () => {},
	handleIgnoreThreatClick: () => {},
	handleUnignoreThreatClick: () => {},
};

export const CredentialsNeeded = Base.bind( {} );
CredentialsNeeded.args = {
	isUserConnected: true,
	hasConnectedOwner: true,
	credentials: false,
	credentialsIsFetching: false,
	credentialsRedirectUrl: '#',
	handleFixThreatClick: () => {},
	handleIgnoreThreatClick: () => {},
	handleUnignoreThreatClick: () => {},
};
