// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let jpcrmAutomationsInitialState: any;

const v4ApiRoot = `${ jpcrmAutomationsInitialState.apiRoot }jetpack-crm/v4`;

export const urls = {
	automation: {
		workflows: ( id?: number ) =>
			id ? `${ v4ApiRoot }/automation/workflows/${ id }` : `${ v4ApiRoot }/automation/workflows`,
	},
};
