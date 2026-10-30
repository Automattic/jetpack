export interface Tool {
	title: string;
	description: string;
	icon: string;
	url: string;
	external: boolean;
}

export interface InitialState {
	domain: string;
	tools: Tool[];
	plan: { name: string | null; url: string } | null;
}

declare global {
	interface Window {
		wpcomMyJetpackInitialState?: InitialState;
	}
}
