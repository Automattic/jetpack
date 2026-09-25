import { ONBOARDING_CHANGE_EVENT } from '../../runtime-contract';
import type { QueryClient } from '@tanstack/react-query';

export const OVERVIEW_MODULES_CHANGE_EVENT = 'jetpack-boost-overview-modules-change';

export const relayedQueryKeys = [ 'modules_state', 'critical_css_state', 'lcp_state' ];

export type ModulesStateChange = { key: string; data: unknown };

/** Tag the Getting Started save with this mutation meta so the bridge holds its interim writes. */
export const ONBOARDING_SAVE_META = { dataSyncKey: 'getting_started' };
export const MODULES_SAVE_META = { dataSyncKey: 'modules_state' };

// Register in the legacy bundle, whose Data Sync cache is separate from the route bundle's cache.
export function observeLegacyModulesState( client: QueryClient ) {
	let modulesHeld = false;
	const isModulesSaving = () =>
		client.isMutating( {
			predicate: mutation => mutation.options.meta?.dataSyncKey === MODULES_SAVE_META.dataSyncKey,
		} ) > 0;
	const emitModules = ( key: string ) => {
		window.dispatchEvent(
			new CustomEvent< ModulesStateChange >( OVERVIEW_MODULES_CHANGE_EVENT, {
				detail: { key, data: client.getQueryData( [ key ] ) },
			} )
		);
	};

	const stopQueries = client.getQueryCache().subscribe( event => {
		if ( event.type !== 'updated' || event.action.type !== 'success' ) {
			return;
		}
		if (
			relayedQueryKeys.some( key => event.query.queryKey[ 0 ] === key ) &&
			( event.action.manual || event.query.queryKey[ 0 ] !== 'modules_state' )
		) {
			const key = String( event.query.queryKey[ 0 ] );
			if ( key === 'modules_state' && isModulesSaving() ) {
				modulesHeld = true;
			} else {
				emitModules( key );
			}
		}
	} );
	const stopMutations = client.getMutationCache().subscribe( event => {
		if ( modulesHeld && event.type === 'updated' && ! isModulesSaving() ) {
			modulesHeld = false;
			emitModules( 'modules_state' );
		}
	} );

	return () => {
		stopQueries();
		stopMutations();
	};
}

// Relays getting_started to the route bundle, which cannot read the legacy bundle's Data Sync cache.
export function observeLegacyOnboarding( client: QueryClient ) {
	let onboardingHeld = false;
	const isOnboardingSaving = () =>
		client.isMutating( {
			predicate: mutation =>
				mutation.options.meta?.dataSyncKey === ONBOARDING_SAVE_META.dataSyncKey,
		} ) > 0;
	const emitOnboarding = () => {
		onboardingHeld = false;
		window.dispatchEvent(
			new CustomEvent( ONBOARDING_CHANGE_EVENT, {
				detail: client.getQueryData( [ 'getting_started' ] ) === true,
			} )
		);
	};

	const stopQueries = client.getQueryCache().subscribe( event => {
		if (
			event.type !== 'updated' ||
			event.action.type !== 'success' ||
			event.query.queryKey[ 0 ] !== 'getting_started'
		) {
			return;
		}
		// Data Sync writes its optimistic value, and any revert, before the save settles.
		if ( isOnboardingSaving() ) {
			onboardingHeld = true;
		} else {
			emitOnboarding();
		}
	} );
	const stopMutations = client.getMutationCache().subscribe( event => {
		if ( onboardingHeld && event.type === 'updated' && ! isOnboardingSaving() ) {
			emitOnboarding();
		}
	} );

	return () => {
		stopQueries();
		stopMutations();
	};
}
