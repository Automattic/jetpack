import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Spinner } from '@wordpress/components';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
import BoostPage from '../../_inc/components/boost-page';
import Overview from '../../_inc/overview/overview';
import {
	getSubpage,
	LOCATION_CHANGE_EVENT,
	LOCATION_EVENTS,
	ONBOARDING_CHANGE_EVENT,
	SETTINGS_SLOT_ID,
	SUBPAGE_SLOT_ID,
} from '../../_inc/runtime-contract';
import type { Tab } from '../../_inc/runtime-contract';
import './route.scss';
import type { ReactNode } from 'react';

const HISTORY_WRAPPED_KEY = '__jetpackBoostLocationChangeWrapped';

// Leave the wrapper installed for the page lifetime so later subscriptions reuse it.
function wrapHistoryOnce() {
	const history = window.history as History & { [ HISTORY_WRAPPED_KEY ]?: boolean };
	if ( history[ HISTORY_WRAPPED_KEY ] ) {
		return;
	}
	history[ HISTORY_WRAPPED_KEY ] = true;
	for ( const method of [ 'pushState', 'replaceState' ] as const ) {
		const original = history[ method ];
		history[ method ] = function (
			this: History,
			...args: Parameters< History[ typeof method ] >
		) {
			const result = original.apply( this, args );
			window.dispatchEvent( new Event( LOCATION_CHANGE_EVENT ) );
			return result;
		};
	}
}

function subscribeToLocationChange( listener: () => void ) {
	wrapHistoryOnce();
	LOCATION_EVENTS.forEach( event => window.addEventListener( event, listener ) );
	return () => LOCATION_EVENTS.forEach( event => window.removeEventListener( event, listener ) );
}

function Stage() {
	const [ queryClient ] = useState( () => new QueryClient() );

	return (
		<QueryClientProvider client={ queryClient }>
			<DashboardStage />
		</QueryClientProvider>
	);
}

function DashboardStage() {
	const search = useSearch( { from: '/' as never, strict: false } ) as { tab?: string };
	const navigate = useNavigate();
	const [ subpage, setSubpage ] = useState( () => getSubpage( window.location.hash ) );
	const lastSubpage = useRef( subpage );
	const [ onboarding, setOnboarding ] = useState(
		() => window.jetpack_boost_ds?.getting_started?.value === true
	);
	const [ headerAction, setHeaderAction ] = useState< ReactNode >( null );
	const pageRef = useRef< HTMLDivElement >( null );
	const settingsRef = useRef< HTMLElement >( null );
	const destination: Tab = search.tab === 'settings' ? 'settings' : 'overview';
	const goToDestination = useCallback(
		( next: Tab, replace = false ) => {
			navigate( {
				search: { tab: next === 'settings' ? 'settings' : undefined },
				replace,
			} as unknown as Parameters< typeof navigate >[ 0 ] );
		},
		[ navigate ]
	);

	useEffect( () => {
		return subscribeToLocationChange( () => {
			const next = getSubpage( window.location.hash );
			const previous = lastSubpage.current;
			if ( next === previous ) {
				return;
			}
			lastSubpage.current = next;
			setSubpage( next );
			if ( ! next && ( previous === 'cache-debug-log' || previous === 'critical-css-advanced' ) ) {
				goToDestination( 'settings', true );
			}
		} );
	}, [ goToDestination ] );

	useEffect( () => {
		const onOnboardingChange = ( event: Event ) =>
			setOnboarding( ( event as CustomEvent< boolean > ).detail );
		window.addEventListener( ONBOARDING_CHANGE_EVENT, onOnboardingChange );
		return () => window.removeEventListener( ONBOARDING_CHANGE_EVENT, onOnboardingChange );
	}, [] );

	useEffect( () => {
		if ( subpage || onboarding ) {
			return;
		}
		const target =
			destination === 'settings'
				? settingsRef.current
				: pageRef.current?.closest( '.jetpack-boost-page__content' );
		const scroll = () => target?.scrollIntoView( { block: 'start', behavior: 'instant' } );
		scroll();
		// Keep the destination aligned while the two runtimes load, until the user takes control.
		const observer = new ResizeObserver( scroll );
		if ( pageRef.current ) {
			observer.observe( pageRef.current );
		}
		const stop = () => observer.disconnect();
		const events = [ 'wheel', 'touchstart', 'pointerdown', 'keydown' ];
		events.forEach( event => window.addEventListener( event, stop, { passive: true } ) );
		return () => {
			stop();
			events.forEach( event => window.removeEventListener( event, stop ) );
		};
	}, [ destination, subpage, onboarding ] );

	return (
		<BoostPage
			isSubpage={ subpage !== null }
			actions={ headerAction }
			subpage={ <div id={ SUBPAGE_SLOT_ID } hidden={ subpage === null } /> }
		>
			<div ref={ pageRef }>
				{ onboarding ? (
					<div
						className="jetpack-boost-dashboard__loading"
						role="status"
						aria-label={ __( 'Loading', 'jetpack-boost' ) }
					>
						<Spinner />
					</div>
				) : (
					<Overview isVisible={ subpage === null } onHeaderActionChange={ setHeaderAction } />
				) }
				<section
					ref={ settingsRef }
					className="jetpack-boost-dashboard__settings"
					aria-labelledby="jetpack-boost-optimize-heading"
					hidden={ onboarding }
				>
					<h2 id="jetpack-boost-optimize-heading">
						{ __( 'Optimize your speed', 'jetpack-boost' ) }
					</h2>
					<div id={ SETTINGS_SLOT_ID } />
				</section>
			</div>
		</BoostPage>
	);
}

export const stage = Stage;
