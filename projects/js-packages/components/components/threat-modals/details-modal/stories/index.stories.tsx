import { storybookThreat, ThreatsContext } from '@automattic/jetpack-scan';
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
						upgradePlan: actionsEnabled ? undefined : () => {},
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
			{ isOpen ? <ThreatModal { ...args } onRequestClose={ onRequestClose } /> : null }
		</div>
	);
};
