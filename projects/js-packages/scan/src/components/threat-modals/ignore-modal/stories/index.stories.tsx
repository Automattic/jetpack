import { Button } from '@automattic/jetpack-components';
import { useCallback, useContext } from 'react';
import {
	FILE_THREAT,
	storybookThreat,
	THREAT_ACTION_IGNORE,
	ThreatsContext,
	ThreatsContextProvider,
} from '@automattic/jetpack-scan';
import ThreatIgnoreModal from '../index.js';

export default {
	title: 'JS Packages/Scan/Threat Modals/Confirm Ignore',
	component: ThreatIgnoreModal,
	argTypes: {
		connection: storybookThreat.argTypes.connection,
		referToCodeable: storybookThreat.argTypes.referToCodeable,
	},
	args: {
		connection: storybookThreat.args.connection,
		referToCodeable: true,
	},
	decorators: [
		( Story, context ) => {
			const { referToCodeable, credentials, connection } = context.args;
			const noop = useCallback( () => {}, [] );
			return (
				<ThreatsContextProvider
					credentials={ credentials }
					connection={ connection }
					referToCodeable={ referToCodeable }
					upgradePlan={ noop }
					actionCallbacks={ {
						ignore: () => {},
						unignore: () => {},
						fix: () => {},
					} }
				>
					<Story { ...context.args } />
				</ThreatsContextProvider>
			);
		},
	],
};

export const Default = args => {
	const { actionToConfirm, setActionToConfirm } = useContext( ThreatsContext );

	const onClick = useCallback(
		() =>
			setActionToConfirm( {
				id: THREAT_ACTION_IGNORE,
				items: [ FILE_THREAT ],
			} ),
		[ setActionToConfirm ]
	);

	const onRequestClose = useCallback( () => setActionToConfirm( null ), [ setActionToConfirm ] );

	return (
		<div>
			<Button onClick={ onClick }>Open Threat Modal</Button>
			{ actionToConfirm && actionToConfirm.id === THREAT_ACTION_IGNORE ? (
				<ThreatIgnoreModal { ...args } onRequestClose={ onRequestClose } />
			) : null }
		</div>
	);
};
