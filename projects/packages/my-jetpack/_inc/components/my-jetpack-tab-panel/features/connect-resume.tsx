import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { isOfflineFeatures } from '../../../data/utils/offline-features';
import { reloadPage } from '../../../utils/reload-page';
import { useModuleActivation } from '../../module-toggle';
import { getFeatureConnectReturnUrl } from '../utils';
import { useAccountConnected } from './feature-state';
import { isAccountConnectEnabled } from './mappings';
import { isBulkSwitchable } from './use-bulk-feature-switch';
import { useFeaturePlugin } from './use-main-features';
import type { FeatureState } from './feature-state';
import type { MyJetpackModule } from '../../../types';

// The URL the click returns or reloads to names that click, so only that tab's own page load acts on it.
export const CONNECT_INTENT_PARAM = 'connect_intent';

export const CONNECT_INTENT_STORAGE_KEY = 'myJetpackFeatureConnectIntent';
// Long enough to sign up for a WordPress.com account on the way.
const MAX_AGE_MS = 60 * 60 * 1000;

type SetupRoute = 'connect' | 'reload';

type ConnectIntent = { id: string; feature: string; at: number; route?: SetupRoute };

/**
 * Forget the click, so a later visit or connection cannot turn the feature on.
 */
function forgetConnectIntent() {
	try {
		window.sessionStorage.removeItem( CONNECT_INTENT_STORAGE_KEY );
	} catch {
		// Nothing was kept if storage is unavailable.
	}
}

/**
 * Remember, in this tab only, that Connect, Install Jetpack or Activate Jetpack was clicked for a
 * feature, so the return from connecting, or Jetpack's reload, can turn it on.
 *
 * @param feature - The feature's slug.
 * @param route   - Whether the click leaves to connect the account or reloads in place.
 * @return The id the return or reload URL carries, or null when the tab cannot keep it.
 */
export function rememberConnectIntent(
	feature: string,
	route: SetupRoute = 'connect'
): string | null {
	try {
		const id = Array.from( window.crypto.getRandomValues( new Uint8Array( 8 ) ), byte =>
			byte.toString( 16 ).padStart( 2, '0' )
		).join( '' );
		const intent: ConnectIntent = { id, feature, at: Date.now(), route };
		window.sessionStorage.setItem( CONNECT_INTENT_STORAGE_KEY, JSON.stringify( intent ) );
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

/**
 * Whether Features turns a feature on after setting up its account or plugin.
 *
 * @return Whether it does.
 */
export function isSetupResumeEnabled(): boolean {
	return isAccountConnectEnabled() && ! isOfflineFeatures();
}

/**
 * Reload Features to turn a feature on, as the return from connecting the account would.
 *
 * @param feature - The feature's slug.
 */
export function reloadToTurnOn( feature: string ) {
	const id = rememberConnectIntent( feature, 'reload' );
	if ( id ) {
		const url = getFeatureConnectReturnUrl( undefined, {
			[ CONNECT_INTENT_PARAM ]: id,
		} );
		// Set the return address before reloading: changing only the part after # does not reload the page.
		window.history.replaceState( window.history.state, '', url );
	}
	reloadPage();
}

type Click = Pick< ConnectIntent, 'feature' | 'at' | 'route' >;

// Kept per page load rather than per mount: Features can mount several times while the page
// loads, and a mount that goes away must not lose the click or turn the feature on twice.
// The click this load came back for: unread, the click, or null once decided.
let taken: Click | null | undefined;
// The click decided on, until a mount starts turning its feature on.
let turnOn: Click | null = null;

/**
 * Whether the click is still within its time limit, checked again at each step since the rows can load late.
 *
 * @param click - The click.
 * @return Whether it can still turn its feature on.
 */
function isFresh( click: Click ): boolean {
	return Date.now() - click.at < MAX_AGE_MS;
}

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
		intent = JSON.parse( window.sessionStorage.getItem( CONNECT_INTENT_STORAGE_KEY ) ?? 'null' );
	} catch {
		intent = null;
	}
	forgetConnectIntent();

	taken =
		intent && returnId && intent.id === returnId && isFresh( intent )
			? { feature: intent.feature, at: intent.at, route: intent.route }
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
 * Whether the return turns the feature on, by the bulk switch's rule.
 *
 * @param state - The feature's live state after the return.
 * @return Whether to turn it on.
 */
function canTurnOn( state: FeatureState ): boolean {
	return isBulkSwitchable( state ) && state.status !== 'active';
}

/**
 * After a return from connecting the account, or Jetpack's reload after Install or Activate Jetpack,
 * the feature whose button was clicked, if it should now be turned on.
 *
 * Forgets the click on the first Features load, whatever happens next. Waits for the feature's live
 * state, since Jetpack may already have turned it on as one of its default modules.
 *
 * @param states - Every feature row on the tab, More Features included.
 * @param ready  - Whether those rows read the site rather than a placeholder.
 * @return The feature to turn on, or null.
 */
export function useConnectResume( states: FeatureState[], ready: boolean ): FeatureState | null {
	const enabled = isSetupResumeEnabled();
	const [ searchParams, setSearchParams ] = useSearchParams();
	const returnId = searchParams.get( CONNECT_INTENT_PARAM );
	const connected = useAccountConnected();
	const [ , setDecided ] = useState( false );

	// Forget the click even with resuming off, so turning it on and reloading cannot replay it.
	takeConnectIntent( returnId );

	// Keeps the id out of the address bar and out of links copied from it.
	useEffect( () => {
		if ( returnId ) {
			const next = new URLSearchParams( searchParams );
			next.delete( CONNECT_INTENT_PARAM );
			setSearchParams( next, { replace: true } );
		}
	}, [ returnId, searchParams, setSearchParams ] );

	useEffect( () => {
		if ( ! enabled || ! ready || ! taken ) {
			return;
		}
		const click = taken;
		const state = states.find( item => item.feature.slug === click.feature );
		if ( state?.pending ) {
			return;
		}
		// A reload connected no account, so only a Connect return needs to find one now.
		const accountReady = connected || click.route === 'reload';
		if ( state && accountReady && isFresh( click ) && canTurnOn( state ) ) {
			turnOn = click;
			setDecided( true );
		}
		taken = null;
	}, [ connected, enabled, ready, states ] );

	const decided = turnOn;
	return ( decided && states.find( item => item.feature.slug === decided.feature ) ) || null;
}

/**
 * Claim the decided feature, so only one mount turns it on, and only if it still can be.
 *
 * @param state - The feature's live state.
 * @return Whether this caller should turn it on.
 */
function claimTurnOn( state: FeatureState ): boolean {
	const click = turnOn;
	if ( click?.feature !== state.feature.slug ) {
		return false;
	}
	turnOn = null;
	return isFresh( click ) && canTurnOn( state );
}

/**
 * Turn a module on with its switch's request and notices.
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
 * Turn a standalone plugin on with its switch's request and notices.
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
 * Turn on the feature whose Connect, Install Jetpack or Activate Jetpack was clicked;
 * no Tracks event fires, since nobody clicked.
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
