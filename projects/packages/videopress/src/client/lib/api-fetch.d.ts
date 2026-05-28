import '@wordpress/api-fetch';
import '@wordpress/element';

declare module '@wordpress/api-fetch' {
	// `Parse` matches the upstream generic signature; we don't use it but
	// the declaration shape must match for module augmentation to merge.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface APIFetchOptions< Parse extends boolean = boolean > {
		apiNamespace?: string;
		global?: boolean;
		formData?: Array< Array< string | Blob > >;
	}
}

declare module '@wordpress/element' {
	// Upstream omits `isNative` from the web Platform shim's type even though
	// it exists at runtime (mirrors React Native's Platform API).
	const Platform: {
		OS: 'web' | 'ios' | 'android';
		select< T >( spec: { web?: T; native?: T; default?: T } ): T | undefined;
		isWeb: boolean;
		isNative: boolean;
	};
}
