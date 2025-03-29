import { useCallback } from 'react';
import { storybookThreat, ThreatsContextProvider } from '@automattic/jetpack-scan';
import ThreatsDataViews from '../index.js';
import { currentData, fixersData, freeData, historicData } from './data.js';

export default {
	title: 'JS Packages/Scan/Threats Data Views',
	component: ThreatsDataViews,
	parameters: {
		backgrounds: {
			default: 'light',
			values: [ { name: 'light', value: 'white' } ],
		},
	},
	argTypes: {
		data: {
			name: 'Data Type',
			description: 'The type of threats to display in the Data View',
			options: {
				'Current Threats': currentData,
				'Historic Threats': historicData,
				'Free Plan Threats': freeData,
				'Threats with Fixers': fixersData,
			},
			control: {
				type: 'select',
			},
		},
		hasPlan: storybookThreat.argTypes.hasPlan,
		connection: storybookThreat.argTypes.connection,
		credentials: storybookThreat.argTypes.credentials,
		referToCodeable: storybookThreat.argTypes.referToCodeable,
	},
	args: {
		data: currentData,
		hasPlan: true,
		connection: storybookThreat.args.connection,
		credentials: storybookThreat.args.credentials,
		referToCodeable: true,
	},
	decorators: [
		( Story, context ) => {
			const { referToCodeable, credentials, connection } = context.args;
			const noop = useCallback( () => {}, [] );
			return (
				<ThreatsContextProvider
					actionCallbacks={ {} }
					credentials={ credentials }
					connection={ connection }
					referToCodeable={ referToCodeable }
					upgradePlan={ context.args.hasPlan ? null : noop }
				>
					<div style={ { maxWidth: '100%', backgroundColor: 'white' } }>
						<Story />
					</div>
				</ThreatsContextProvider>
			);
		},
	],
};

export const Default = args => <ThreatsDataViews { ...args } />;
