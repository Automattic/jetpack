export declare global {
	interface Window {
		wp: {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			media: any;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			apiFetch?: ( options: Record< string, any > ) => Promise< Response >;
		};
	}
}
