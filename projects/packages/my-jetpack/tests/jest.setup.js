const globalScope = typeof window !== 'undefined' ? window : globalThis;
globalScope.JP_CONNECTION_INITIAL_STATE = {
	userConnectionData: {
		currentUser: {
			wpcomUser: { Id: 99999, login: 'bobsacramento', display_name: 'Bob Sacramento' },
		},
	},
};
globalScope.myJetpackInitialState = {};
globalScope.myJetpackRest = {};
