import { Button } from '@automattic/jetpack-components';
import { useCallback, useState } from 'react';
import ThreatModal from '../index.tsx';

export default {
	title: 'JS Packages/Scan/Threat Modal',
	component: ThreatModal,
};

const Base = args => {
	const [ isOpen, setIsOpen ] = useState( false );
	const onClick = useCallback( () => setIsOpen( true ), [] );
	const onRequestClose = useCallback( () => setIsOpen( false ), [] );
	return (
		<div>
			<Button onClick={ onClick }>Open Threat Modal</Button>
			{ isOpen ? <ThreatModal { ...args } onRequestClose={ onRequestClose } /> : null }
		</div>
	);
};

export const ThreatResult = Base.bind( {} );
ThreatResult.args = {
	threat: {
		id: 185869885,
		signature: 'EICAR_AV_Test',
		title: 'Malicious code found in file: index.php',
		description:
			"This is the standard EICAR antivirus test code, and not a real infection. If your site contains this code when you don't expect it to, contact Jetpack support for some help.",
		firstDetected: '2024-10-07T20:45:06.000Z',
		fixedIn: null,
		severity: 8,
		fixable: { fixer: 'rollback', target: 'January 26, 2024, 6:49 am', extensionStatus: '' },
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
	isUserConnected: true,
	hasConnectedOwner: true,
	credentials: [ { type: 'managed', role: 'main', still_valid: true } ],
	handleFixThreatClick: () => {},
	handleIgnoreThreatClick: () => {},
	handleUnignoreThreatClick: () => {},
};

export const AdditionalConnectionsNeeded = Base.bind( {} );
AdditionalConnectionsNeeded.args = {
	threat: {
		id: 185869885,
		signature: 'EICAR_AV_Test',
		title: 'Malicious code found in file: index.php',
		description:
			"This is the standard EICAR antivirus test code, and not a real infection. If your site contains this code when you don't expect it to, contact Jetpack support for some help.",
		firstDetected: '2024-10-07T20:45:06.000Z',
		fixedIn: null,
		severity: 8,
		fixable: { fixer: 'rollback', target: 'January 26, 2024, 6:49 am', extensionStatus: '' },
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
	threat: {
		id: 185869885,
		signature: 'EICAR_AV_Test',
		title: 'Malicious code found in file: index.php',
		description:
			"This is the standard EICAR antivirus test code, and not a real infection. If your site contains this code when you don't expect it to, contact Jetpack support for some help.",
		firstDetected: '2024-10-07T20:45:06.000Z',
		fixedIn: null,
		severity: 8,
		fixable: { fixer: 'rollback', target: 'January 26, 2024, 6:49 am', extensionStatus: '' },
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
	threat: {
		id: 185869885,
		signature: 'EICAR_AV_Test',
		title: 'Malicious code found in file: index.php',
		description:
			"This is the standard EICAR antivirus test code, and not a real infection. If your site contains this code when you don't expect it to, contact Jetpack support for some help.",
		firstDetected: '2024-10-07T20:45:06.000Z',
		fixedIn: null,
		severity: 8,
		fixable: { fixer: 'rollback', target: 'January 26, 2024, 6:49 am', extensionStatus: '' },
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
	isUserConnected: true,
	hasConnectedOwner: true,
	credentials: false,
	credentialsIsFetching: false,
	credentialsRedirectUrl: '#',
	handleFixThreatClick: () => {},
	handleIgnoreThreatClick: () => {},
	handleUnignoreThreatClick: () => {},
};

export const InProgressFixer = Base.bind( {} );
InProgressFixer.args = {
	threat: {
		id: 185869885,
		signature: 'EICAR_AV_Test',
		title: 'Malicious code found in file: index.php',
		description:
			"This is the standard EICAR antivirus test code, and not a real infection. If your site contains this code when you don't expect it to, contact Jetpack support for some help.",
		firstDetected: '2024-10-07T20:45:06.000Z',
		fixedIn: null,
		severity: 8,
		fixable: { fixer: 'rollback', target: 'January 26, 2024, 6:49 am', extensionStatus: '' },
		fixer: { status: 'in_progress' },
		status: 'current',
		filename: '/var/www/html/wp-content/index.php',
		context: {
			'1': 'echo <<<HTML',
			'2': 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*',
			'3': 'HTML;',
			marks: {},
		},
	},
	isUserConnected: true,
	hasConnectedOwner: true,
	handleConnectUser: () => {},
	credentials: [ { type: 'managed', role: 'main', still_valid: true } ],
	credentialsRedirectUrl: '#',
	handleFixThreatClick: () => {},
	handleIgnoreThreatClick: () => {},
	handleUnignoreThreatClick: () => {},
};

export const ErrorFixer = Base.bind( {} );
ErrorFixer.args = {
	threat: {
		id: 185869885,
		signature: 'EICAR_AV_Test',
		title: 'Malicious code found in file: index.php',
		description:
			"This is the standard EICAR antivirus test code, and not a real infection. If your site contains this code when you don't expect it to, contact Jetpack support for some help.",
		firstDetected: '2024-10-07T20:45:06.000Z',
		fixedIn: null,
		severity: 8,
		fixable: { fixer: 'rollback', target: 'January 26, 2024, 6:49 am', extensionStatus: '' },
		fixer: { error: 'error' },
		status: 'current',
		filename: '/var/www/html/wp-content/index.php',
		context: {
			'1': 'echo <<<HTML',
			'2': 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*',
			'3': 'HTML;',
			marks: {},
		},
	},
	isUserConnected: true,
	hasConnectedOwner: true,
	handleConnectUser: () => {},
	credentials: [ { type: 'managed', role: 'main', still_valid: true } ],
	credentialsRedirectUrl: '#',
	handleFixThreatClick: () => {},
	handleIgnoreThreatClick: () => {},
	handleUnignoreThreatClick: () => {},
};

export const StaleFixer = Base.bind( {} );
StaleFixer.args = {
	threat: {
		id: 185869885,
		signature: 'EICAR_AV_Test',
		title: 'Malicious code found in file: index.php',
		description:
			"This is the standard EICAR antivirus test code, and not a real infection. If your site contains this code when you don't expect it to, contact Jetpack support for some help.",
		firstDetected: '2024-10-07T20:45:06.000Z',
		fixedIn: null,
		severity: 8,
		fixable: { fixer: 'rollback', target: 'January 26, 2024, 6:49 am', extensionStatus: '' },
		fixer: { status: 'in_progress', lastUpdated: new Date( '1999-01-01' ).toISOString() },
		status: 'current',
		filename: '/var/www/html/wp-content/index.php',
		context: {
			'1': 'echo <<<HTML',
			'2': 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*',
			'3': 'HTML;',
			marks: {},
		},
	},
	isUserConnected: true,
	hasConnectedOwner: true,
	handleConnectUser: () => {},
	credentials: [ { type: 'managed', role: 'main', still_valid: true } ],
	credentialsRedirectUrl: '#',
	handleFixThreatClick: () => {},
	handleIgnoreThreatClick: () => {},
	handleUnignoreThreatClick: () => {},
};

export const VulnerableExtension = Base.bind( {} );
VulnerableExtension.args = {
	threat: {
		id: 184847701,
		signature: 'Vulnerable.WP.Extension',
		title: 'Vulnerable Plugin: WP Super Cache (version 1.6.3)',
		description:
			'The plugin WP Super Cache (version 1.6.3) has a known vulnerability. The WP Super Cache plugin before version 1.7.2 is vulnerable to an authenticated RCE in the settings page.',
		fixedIn: '1.12.4',
		source: 'https://wpscan.com/vulnerability/733d8a02-0d44-4b78-bbb2-37e447acd2f3',
		extension: {
			name: 'WP Super Cache',
			slug: 'wp-super-cache',
			version: '1.6.3',
			type: 'plugins',
		},
	},
	isUserConnected: true,
	hasConnectedOwner: true,
	credentials: [ { type: 'managed', role: 'main', still_valid: true } ],
	handleUpgradeClick: () => {},
};
