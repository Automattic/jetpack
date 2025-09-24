import { registerStore, select } from '@wordpress/data';

type InterfaceState = {
	activeAreas: Record< string, string | null >;
};

type EnableComplementaryAreaAction = {
	type: 'ENABLE_COMPLEMENTARY_AREA';
	scope: string;
	area: string;
};

const STORE_KEY = 'core/interface';
const DEFAULT_STATE: InterfaceState = {
	activeAreas: {},
};

const actions = {
	enableComplementaryArea( scope: string, area: string ): EnableComplementaryAreaAction {
		return {
			type: 'ENABLE_COMPLEMENTARY_AREA',
			scope,
			area,
		};
	},
};

const reducer = (
	state: InterfaceState = DEFAULT_STATE,
	action: EnableComplementaryAreaAction
): InterfaceState => {
	if ( action.type === 'ENABLE_COMPLEMENTARY_AREA' ) {
		return {
			...state,
			activeAreas: {
				...state.activeAreas,
				[ action.scope ]: action.area,
			},
		};
	}

	return state;
};

const selectors = {
	getActiveComplementaryArea( state: InterfaceState, scope: string ): string | null {
		return state.activeAreas[ scope ] ?? null;
	},
};

let isRegistered = false;

export default function ensureInterfaceStore() {
	if ( isRegistered ) {
		return;
	}

	try {
		const existing = select( STORE_KEY );
		if ( existing ) {
			isRegistered = true;
			return;
		}
	} catch {
		// The store is not registered yet, continue to register a fallback.
	}

	registerStore( STORE_KEY, {
		reducer,
		actions,
		selectors,
	} );
	isRegistered = true;
}
