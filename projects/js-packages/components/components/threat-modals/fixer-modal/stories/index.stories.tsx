import { storybookThreat, ThreatsContextProvider } from '@automattic/jetpack-scan';
import { Meta } from '@storybook/react';
import { useCallback, useState } from 'react';
import Button from '../../../button/index.js';
import ThreatFixerModal from '../index.js';

export default {
	title: 'JS Packages/Components/Threat Modals/Threat Fixer',
	component: ThreatFixerModal,
	argTypes: {
		...storybookThreat.argTypes,
		batch: {
			name: 'Batch Fixer',
			description: 'Show a batch fixer modal.',
			control: {
				type: 'boolean',
			},
		},
	},
	args: {
		...storybookThreat.args,
		batch: false,
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
				batch,
			} = context.args;
			const threat = { ...threatPreset, ...threatFixerProps };
			const noop = useCallback( () => {}, [] );
			return (
				<ThreatsContextProvider
					initialSelectedThreat={ threat }
					credentials={ credentials }
					connection={ connection }
					referToCodeable={ referToCodeable }
					upgradePlan={ actionsEnabled ? undefined : noop }
					actionCallbacks={
						actionsEnabled
							? {
									ignore: () => {},
									unignore: () => {},
									fix: () => {},
							  }
							: null
					}
					fixersStatus={ {
						ok: true,
						threats: {
							[ threat.id + '1' ]: { inProgress: false },
							[ threat.id ]: { ...threatFixerProps?.fixer },
						},
					} }
					initialActionToConfirm={ {
						id: 'fix',
						items: batch
							? [
									{ ...threat, id: threat.id + '1' },
									{ ...threat, id: threat.id + '2' },
									{ ...threat, id: threat.id + '3' },
							  ]
							: [ threat ],
					} }
				>
					<Story { ...context.args } />
				</ThreatsContextProvider>
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
			{ isOpen ? <ThreatFixerModal { ...args } onRequestClose={ onRequestClose } /> : null }
		</div>
	);
};

export const BatchFixer = Default.bind( {} );
BatchFixer.args = {
	batch: true,
};
