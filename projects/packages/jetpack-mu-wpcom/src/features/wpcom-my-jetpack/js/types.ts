export interface Tool {
	title: string;
	description: string;
	key: string;
	section: string;
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
