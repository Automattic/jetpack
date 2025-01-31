import { storybookThreat, ThreatsContextProvider } from '@automattic/jetpack-scan';
import { Meta } from '@storybook/react';
import { useCallback, useState } from 'react';
import Button from '../../../button/index.js';
import ThreatModal from '../index.js';

export default {
	title: 'JS Packages/Components/Threat Modals/Threat Details',
	component: ThreatModal,
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
			const noop = useCallback( () => {}, [] );
			return (
				<ThreatsContextProvider
					initialSelectedThreat={ { ...threatPreset, ...threatFixerProps } }
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
			{ isOpen ? <ThreatModal { ...args } onRequestClose={ onRequestClose } /> : null }
		</div>
	);
};
