export const JetpackSeoRoutes = {
	Overview: '/',
} as const;

// Data-sync namespace — also the name of the bootstrapped window global
// (`window.jetpack_seo`) and must match the server-side
// `Initializer::DATA_SYNC_NAMESPACE`.
export const DATA_SYNC_NAMESPACE = 'jetpack_seo';
