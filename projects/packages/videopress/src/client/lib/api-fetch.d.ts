import '@wordpress/api-fetch';

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
