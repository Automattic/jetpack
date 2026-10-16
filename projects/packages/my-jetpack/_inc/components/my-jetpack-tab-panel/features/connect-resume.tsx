import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { isOfflineFeatures } from '../../../data/utils/offline-features';
import { useModuleActivation } from '../../module-toggle';
import { useAccountConnected } from './feature-state';
import { isAccountConnectEnabled } from './mappings';
import { isBulkSwitchable } from './use-bulk-feature-switch';
import { useFeaturePlugin } from './use-main-features';
import type { FeatureState } from './feature-state';
import type { MyJetpackModule } from '../../../types';

// The return URL names the click it came back for, so only that tab's own return acts on it.
export const CONNECT_INTENT_PARAM = 'connect_intent';

const STORAGE_KEY = 'myJetpackFeatureConnectIntent';
// Long enough to sign up for a WordPress.com account on the way.
const MAX_AGE_MS = 60 * 60 * 1000;

type ConnectIntent = { id: string; feature: string; at: number };

/**
 * Forget the click, so a later visit or connection cannot turn the feature on.
 */
function forgetConnectIntent() {
	try {
		window.sessionStorage.removeItem( STORAGE_KEY );
	} catch {
		// Nothing was kept if storage is unavailable.
	}
}

/**
 * Remember, in this tab only, that Connect was clicked for a feature, so the return can turn it on.
 *
 * @param feature - The feature's slug.
 * @return The id the return URL carries, or null when the tab cannot keep it.
 */
export function rememberConnectIntent( feature: string ): string | null {
	try {
		const id = Array.from( window.crypto.getRandomValues( new Uint8Array( 8 ) ), byte =>
			byte.toString( 16 ).padStart( 2, '0' )
		).join( '' );
		const intent: ConnectIntent = { id, feature, at: Date.now() };
		window.sessionStorage.setItem( STORAGE_KEY, JSON.stringify( intent ) );
		// Going Back from WordPress.com can show this page again without loading it: that is an
		// abandoned connection, not a return.
		window.addEventListener(
			'pageshow',
			event => ( event as PageTransitionEvent ).persisted && forgetConnectIntent(),
			{ once: true }
		);
		return id;
	} catch {
		return null;
	}
}

// Kept per page load rather than per mount: Features can mount several times while the page
// loads, and a mount that goes away must not lose the click or turn the feature on twice.
// The feature this load came back for: unread, a slug, or null once decided.
let taken: string | null | undefined;
// The feature decided on, until a mount starts turning it on.
let turnOn: string | null = null;

/**
 * Read and forget the remembered click, once per page load, whichever Features mount asks first.
 *
 * @param returnId - The id in the return URL, if the page was loaded from one.
 */
function takeConnectIntent( returnId: string | null ) {
	if ( taken !== undefined ) {
		return;
	}

	let intent: ConnectIntent | null;
	try {
		intent = JSON.parse( window.sessionStorage.getItem( STORAGE_KEY ) ?? 'null' );
	} catch {
		intent = null;
	}
	forgetConnectIntent();

	taken =
		intent && returnId && intent.id === returnId && Date.now() - intent.at < MAX_AGE_MS
			? intent.feature
			: null;
}

/**
 * Let a test start a new page load.
 */
export function resetConnectIntentForTests() {
	taken = undefined;
	turnOn = null;
}

/**
 * Whether the feature's own switch on this page would turn it on, so the return can do the same.
 *
 * @param state - The feature's live state after the return.
 * @return Whether to turn it on.
 */
function canTurnOn( state: FeatureState ): boolean {
	return isBulkSwitchable( state ) && state.status !== 'active';
}

/**
 * After a return from connecting the account, the feature whose Connect was clicked, if it should now be turned on.
 *
 * Forgets the click on the first Features load, connected or not. Waits for the feature's live
 * state, since Jetpack may already have turned it on as one of its default modules.
 *
 * @param states - Every feature row on the tab, More Features included.
 * @param ready  - Whether those rows read the site rather than a placeholder.
 * @return The feature to turn on, or null.
 */
export function useConnectResume( states: FeatureState[], ready: boolean ): FeatureState | null {
	const enabled = isAccountConnectEnabled() && ! isOfflineFeatures();
	const [ searchParams, setSearchParams ] = useSearchParams();
	const returnId = searchParams.get( CONNECT_INTENT_PARAM );
	const connected = useAccountConnected();
	const [ , setDecided ] = useState( false );

	if ( enabled ) {
		takeConnectIntent( returnId );
	}

	// Keeps the id out of the address bar and out of links copied from it.
	useEffect( () => {
		if ( enabled && returnId ) {
			const next = new URLSearchParams( searchParams );
			next.delete( CONNECT_INTENT_PARAM );
			setSearchParams( next, { replace: true } );
		}
	}, [ enabled, returnId, searchParams, setSearchParams ] );

	useEffect( () => {
		if ( ! enabled || ! ready || ! taken ) {
			return;
		}
		const state = states.find( item => item.feature.slug === taken );
		if ( state?.pending ) {
			return;
		}
		if ( state && connected && canTurnOn( state ) ) {
			turnOn = taken;
			setDecided( true );
		}
		taken = null;
	}, [ connected, enabled, ready, states ] );

	return ( turnOn && states.find( item => item.feature.slug === turnOn ) ) || null;
}

/**
 * Claim the decided feature, so only one mount turns it on, and only if it still can be.
 *
 * @param state - The feature's live state.
 * @return Whether this caller should turn it on.
 */
function claimTurnOn( state: FeatureState ): boolean {
	if ( turnOn !== state.feature.slug ) {
		return false;
	}
	turnOn = null;
	return canTurnOn( state );
}

/**
 * Turn a module on with its switch's request and notices; no Tracks event fires, since nobody clicked.
 *
 * @param {object}          props        - The component props.
 * @param {FeatureState}    props.state  - The feature's live state.
 * @param {MyJetpackModule} props.module - The module.
 * @return The rendered component.
 */
function TurnOnModule( {
	state,
	module: $module,
}: {
	state: FeatureState;
	module: MyJetpackModule;
} ) {
	const { setModuleActive } = useModuleActivation( $module, { reload: false } );

	useEffect( () => {
		if ( claimTurnOn( state ) ) {
			setModuleActive( true );
		}
	}, [ setModuleActive, state ] );

	return null;
}

/**
 * Turn a standalone plugin on with its switch's request and notices; no Tracks event fires, since nobody clicked.
 *
 * @param {object}       props        - The component props.
 * @param {FeatureState} props.state  - The feature's live state.
 * @param {string}       props.plugin - The plugin's slug.
 * @param {string}       props.name   - The plugin's name, for the notice.
 * @return The rendered component.
 */
function TurnOnPlugin( {
	state,
	plugin,
	name,
}: {
	state: FeatureState;
	plugin: string;
	name: string;
} ) {
	const { run } = useFeaturePlugin( plugin, name );

	useEffect( () => {
		if ( claimTurnOn( state ) ) {
			run( 'activate' );
		}
	}, [ run, state ] );

	return null;
}

/**
 * Turn on the feature the account was connected for.
 *
 * @param {object}       props       - The component props.
 * @param {FeatureState} props.state - The feature's live state.
 * @return The rendered component.
 */
export function ConnectResume( { state }: { state: FeatureState } ) {
	const { control, feature } = state;

	if ( control.kind === 'module' ) {
		return <TurnOnModule state={ state } module={ control.module } />;
	}

	if ( control.kind === 'plugin' ) {
		return (
			<TurnOnPlugin
				state={ state }
				plugin={ control.plugin }
				name={ feature.plugin_name || feature.name }
			/>
		);
	}

	return null;
}
