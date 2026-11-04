export interface Tool {
	title: string;
	description: string;
	icon: string;
	url: string;
}

export interface InitialState {
	tools: Tool[];
	plan: { name: string | null; url: string } | null;
}

declare global {
	interface Window {
		wpcomMyJetpackInitialState?: InitialState;
	}
}
