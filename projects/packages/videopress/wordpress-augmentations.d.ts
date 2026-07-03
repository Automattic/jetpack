import '@wordpress/api-fetch';
import '@wordpress/element';

declare module '@wordpress/api-fetch' {
	// `Parse` is unused but must match the upstream generic for the augmentation to merge.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface APIFetchOptions< Parse extends boolean = boolean > {
		apiNamespace?: string;
		global?: boolean;
		formData?: Array< Array< string | Blob > >;
	}
}

declare module '@wordpress/element' {
	// Mirrors the runtime Platform shim to add `isNative`, which upstream types omit. Keep in sync with @wordpress/element.
	const Platform: {
		OS: 'web' | 'ios' | 'android';
		select< T >( spec: { web?: T; native?: T; default?: T } ): T | undefined;
		isWeb: boolean;
		isNative: boolean;
	};
}
