import { storybookThreat, ThreatsContext } from '@automattic/jetpack-scan';
import { Meta } from '@storybook/react';
import { useCallback, useState } from 'react';
import Button from '../../../button/index.js';
import ThreatIgnoreModal from '../index.js';

export default {
	title: 'JS Packages/Components/Threat Modals/Confirm Ignore',
	component: ThreatIgnoreModal,
	argTypes: {
		...storybookThreat.argTypes,
	},
	args: {
		...storybookThreat.args,
	},
	decorators: [
		( Story, context ) => {
			const {
				threatPreset,
				threatFixerProps,
				actionsEnabled,
				referToCodeable,
				credentials,
				connection,
			} = context.args;
			return (
				<ThreatsContext.Provider
					value={ {
						selectedThreat: { ...threatPreset, ...threatFixerProps },
						actionCallbacks: actionsEnabled
							? {
									ignore: () => {},
									unignore: () => {},
									fix: () => {},
							  }
							: null,
						credentials,
						connection,
						referToCodeable,
						upgradePlan: () => {},
					} }
				>
					<Story { ...context.args } />
				</ThreatsContext.Provider>
			);
		},
	],
} as Meta;

export const Default = args => {
	const [ isOpen, setIsOpen ] = useState( false );
	const onClick = useCallback( () => setIsOpen( true ), [] );
	const onRequestClose = useCallback( () => setIsOpen( false ), [] );

	return (
		<div>
			<Button onClick={ onClick }>Open Threat Modal</Button>
			{ isOpen ? <ThreatIgnoreModal { ...args } onRequestClose={ onRequestClose } /> : null }
		</div>
	);
};

export const VulnerableExtension = Default.bind( {} );
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
};
