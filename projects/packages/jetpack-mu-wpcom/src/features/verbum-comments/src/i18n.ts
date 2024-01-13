declare global {
	interface Window {
		VerbumComments: Record< string, string >;
	}
}

export function translate( string: string ) {
	return window.VerbumComments?.[ string ] ?? string;
}
