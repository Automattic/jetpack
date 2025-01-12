import { useCallback, useMemo } from 'react';
import ThreatFixerButton from '../index.js';

export default {
	title: 'JS Packages/Components/Threat Fixer Button',
	component: ThreatFixerButton,
	decorators: [
		Story => (
			<div style={ { height: '175px' } }>
				<Story />
			</div>
		),
	],
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		threatType: {
			name: 'Threat Type',
			control: {
				type: 'select',
			},
			options: [ 'plugins', 'themes', 'core', 'directory', 'file' ],
		},
		threatSignature: {
			name: 'Threat Signature',
			control: {
				type: 'select',
			},
			options: [ 'Core.File.Modification', 'php_hardening_WP_Config_NoSalts_001' ],
		},
		fixerType: {
			name: 'Fixer Type',
			control: {
				type: 'select',
			},
			options: [ 'edit', 'update', 'replace', 'delete' ],
		},
		fixerStatus: {
			name: 'Fixer Status',
			control: {
				type: 'select',
			},
			options: [ 'not_started', 'in_progress', 'fixed', 'not_fixed' ],
		},
		fixerIsStale: {
			name: 'Stale Fixer',
			control: {
				type: 'boolean',
			},
		},
		fixerIsError: {
			name: 'Error',
			control: {
				type: 'boolean',
			},
		},
	},
};

export const Default = args => {
	const threat = useMemo( () => {
		const t = {
			id: '123',
			fixable: {
				fixer: args.fixerType || 'edit',
				status: args.fixerStatus || 'not_started',
				lastUpdated: args.fixerIsStale ? new Date( '1999-01-01' ).toISOString() : undefined,
			},
			fixer: {
				fixer: args.fixerType || 'edit',
				status: args.fixerStatus || 'not_started',
				lastUpdated: args.fixerIsStale ? new Date( '1999-01-01' ).toISOString() : undefined,
			},
			filename: undefined,
			extension:
				args.fixerType === 'themes' || args.fixerType === 'plugins'
					? {
							type: args.extensionType || 'plugins',
							slug: 'example-extension',
							name: 'Example Extension',
							version: '1.2.3',
					  }
					: undefined,
			signature: args.threatSignature || undefined,
			error: args.fixerIsError ? 'Example Error' : undefined,
		};

		if ( args.fixerType === 'directory' ) {
			t.filename = '/var/www/html/wp-content/uploads/';
		} else if ( args.fixerType === 'file' ) {
			if ( args.threatSignature === 'Core.File.Modification' ) {
				t.filename = '/var/www/html/wp-admin/index.php';
			} else {
				t.filename = '/var/www/html/wp-content/uploads/jptt_eicar.php';
			}
		}

		return t;
	}, [
		args.fixerType,
		args.extensionType,
		args.threatSignature,
		args.fixerStatus,
		args.fixerIsStale,
		args.fixerIsError,
	] );

	const onClick = useCallback( () => alert( 'Fixer callback triggered' ), [] ); // eslint-disable-line no-alert

	return <ThreatFixerButton threat={ threat } onClick={ onClick } />;
};
