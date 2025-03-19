import { Button } from '@automattic/jetpack-components';
import { useCallback, useMemo, useState } from 'react';
import { storybookThreat, ThreatsContextProvider } from '@automattic/jetpack-scan';
import ThreatDetailsModal from '../index.js';

export default {
	title: 'JS Packages/Scan/Threat Modals/Threat Details',
	component: ThreatDetailsModal,
	argTypes: {
		...storybookThreat.argTypes,
	},
	args: {
		...storybookThreat.args,
	},
	decorators: [
		( Story, context ) => {
			const { actionsEnabled, credentials, connection, referToCodeable } = context.args;
			const noop = useCallback( () => {}, [] );
			return (
				<ThreatsContextProvider
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
};

export const Default = args => {
	const threat = useMemo(
		() => ( { ...args.threatPreset, ...args.threatFixerProps } ),
		[ args.threatFixerProps, args.threatPreset ]
	);

	const [ isOpen, setIsOpen ] = useState( false );
	const onClick = useCallback( () => setIsOpen( true ), [] );
	const onRequestClose = useCallback( () => setIsOpen( false ), [] );

	return (
		<div>
			<Button onClick={ onClick }>Open Threat Modal</Button>
			{ isOpen ? <ThreatDetailsModal threat={ threat } onRequestClose={ onRequestClose } /> : null }
		</div>
	);
};
