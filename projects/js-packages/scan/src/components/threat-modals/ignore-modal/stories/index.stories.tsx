import { Button } from '@automattic/jetpack-components';
import { useCallback, useState } from 'react';
import {
	storybookThreat,
	THREAT_ACTION_IGNORE,
	ThreatsContextProvider,
} from '@automattic/jetpack-scan';
import ThreatIgnoreModal from '../index.js';

export default {
	title: 'JS Packages/Scan/Threat Modals/Confirm Ignore',
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
			const threat = { ...threatPreset, ...threatFixerProps, status: 'active' };
			const noop = useCallback( () => {}, [] );
			return (
				<ThreatsContextProvider
					credentials={ credentials }
					connection={ connection }
					referToCodeable={ referToCodeable }
					upgradePlan={ noop }
					actionCallbacks={
						actionsEnabled
							? {
									ignore: () => {},
									unignore: () => {},
									fix: () => {},
							  }
							: null
					}
					initialSelectedThreat={ threat }
					initialActionToConfirm={ {
						id: THREAT_ACTION_IGNORE,
						items: [ threat ],
					} }
				>
					<Story { ...context.args } />
				</ThreatsContextProvider>
			);
		},
	],
};

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
