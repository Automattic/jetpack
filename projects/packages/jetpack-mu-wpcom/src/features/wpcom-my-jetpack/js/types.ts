export interface Tool {
	title: string;
	description: string;
	icon: string;
	url: string;
}

export interface InitialState {
	tools: Tool[];
}

declare global {
	interface Window {
		wpcomMyJetpackInitialState?: InitialState;
	}
}
