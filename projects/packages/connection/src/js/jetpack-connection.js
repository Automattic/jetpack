import { initConnectionStore } from '@automattic/jetpack-connection';

export * from '@automattic/jetpack-connection';

// Plugin builds from before initConnectionStore() read the store by ID from this script and expect it registered.
initConnectionStore();
