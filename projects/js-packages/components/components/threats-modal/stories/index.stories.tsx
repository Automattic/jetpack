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

	const handleFixThreatClick = useCallback( threats => {
		const threatIds = threats.map( ( { id } ) => id ).join( ', ' );
		alert( `Fix threat action callback triggered for threats with IDs: ${ threatIds }` ); // eslint-disable-line no-alert
	}, [] );

	const handleIgnoreThreatClick = useCallback( threat => {
		const threatId = threat.map( ( { id } ) => id ).join( ', ' );
		alert( `Ignore threat action callback triggered for threat ID: ${ threatId }` ); // eslint-disable-line no-alert
	}, [] );

	const handleUnignoreThreatClick = useCallback( threat => {
		const threatId = threat.map( ( { id } ) => id ).join( ', ' );
		alert( `Un-ignore threat action callback triggered for threat ID: ${ threatId }` ); // eslint-disable-line no-alert
	}, [] );

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
							id: 12345678910,
							signature: 'Vulnerable.WP.Extension',
							title: 'Vulnerable Plugin: Example Plugin (version 1.2.3)',
							description: 'This threat has an in-progress auto-fixer.',
							firstDetected: '2024-10-02T17:34:59.000Z',
							fixedIn: '1.2.4',
							severity: 3,
							fixable: { fixer: 'update', target: '1.12.4', extensionStatus: 'inactive' },
							fixer: { status: 'in_progress', lastUpdated: new Date().toISOString() },
							status: 'current',
							source: 'https://wpscan.com/vulnerability/733d8a02-0d44-4b78-bbb2-37e447acd2f3',
							extension: {
								name: 'Example Plugin',
								slug: 'example-plugin',
								version: '1.2.3',
								type: 'plugins',
							},
						},
						{
							id: 12345678911,
							signature: 'Vulnerable.WP.Extension',
							title: 'Vulnerable Theme: Example Theme (version 2.2.2)',
							description: 'This threat has an in-progress auto-fixer that is taking too long.',
							firstDetected: '2024-10-02T17:34:59.000Z',
							fixedIn: '2.22.22',
							severity: 3,
							fixable: { fixer: 'update', target: '1.12.4', extensionStatus: 'inactive' },
							fixer: { status: 'in_progress', lastUpdated: new Date( '1999-01-01' ).toISOString() },
							status: 'current',
							source: 'https://wpscan.com/vulnerability/733d8a02-0d44-4b78-bbb2-37e447acd2f3',
							extension: {
								name: 'Example Theme',
								slug: 'example-theme',
								version: '2.2.2',
								type: 'themes',
							},
						},
					] }
					onRequestClose={ onRequestClose }
					actionToConfirm={ 'all' }
					handleFixThreatClick={ handleFixThreatClick }
					handleIgnoreThreatClick={ handleIgnoreThreatClick }
					handleUnignoreThreatClick={ handleUnignoreThreatClick }
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
};

export const ThreatsResult = Base.bind( {} );
ThreatsResult.args = {
	isUserConnected: true,
	hasConnectedOwner: true,
	credentials: [ { type: 'managed', role: 'main', still_valid: true } ],
};

export const AdditionalConnectionsNeeded = Base.bind( {} );
AdditionalConnectionsNeeded.args = {
	isUserConnected: false,
	hasConnectedOwner: false,
	credentials: false,
	credentialsRedirectUrl: '#',
	handleConnectUser: () => {},
};

export const UserConnectionNeeded = Base.bind( {} );
UserConnectionNeeded.args = {
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
	isUserConnected: false,
	hasConnectedOwner: false,
	handleConnectUser: () => {},
	credentials: [ { type: 'managed', role: 'main', still_valid: true } ],
	credentialsRedirectUrl: '#',
};

export const CredentialsNeeded = Base.bind( {} );
CredentialsNeeded.args = {
	isUserConnected: true,
	hasConnectedOwner: true,
	credentials: false,
	credentialsIsFetching: false,
	credentialsRedirectUrl: '#',
};
