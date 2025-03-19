import { Button } from '@automattic/jetpack-components';
import { useCallback, useContext, useMemo } from 'react';
import { storybookThreat, ThreatsContext, ThreatsContextProvider } from '@automattic/jetpack-scan';
import ThreatFixerModal from '../index.js';

export default {
	title: 'JS Packages/Scan/Threat Modals/Threat Fixer',
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
			} = context.args;
			const threat = useMemo(
				() => ( { ...threatPreset, ...threatFixerProps } ),
				[ threatPreset, threatFixerProps ]
			);
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
					fixersStatus={ {
						ok: true,
						threats: {
							[ threat.id + '1' ]: { inProgress: false },
							[ threat.id ]: { ...threatFixerProps?.fixer },
						},
					} }
				>
					<Story { ...context.args } />
				</ThreatsContextProvider>
			);
		},
	],
};

export const Default = args => {
	const threat = useMemo( () => ( { ...args.threatPreset, ...args.threatFixerProps } ), [ args ] );
	const { actionToConfirm, setActionToConfirm } = useContext( ThreatsContext );
	const onClick = useCallback(
		() =>
			setActionToConfirm( {
				id: 'fix',
				items: args.batch
					? [
							{ ...threat, id: threat.id + '1' },
							{ ...threat, id: threat.id + '2' },
							{ ...threat, id: threat.id + '3' },
					  ]
					: [ threat ],
			} ),
		[ threat, setActionToConfirm, args.batch ]
	);
	const onRequestClose = useCallback(
		() => setActionToConfirm( undefined ),
		[ setActionToConfirm ]
	);

	return (
		<div>
			<Button onClick={ onClick }>Open Threat Modal</Button>
			{ actionToConfirm ? (
				<ThreatFixerModal { ...args } onRequestClose={ onRequestClose } />
			) : null }
		</div>
	);
};

export const BatchFixer = Default.bind( {} );
BatchFixer.args = {
	batch: true,
};
