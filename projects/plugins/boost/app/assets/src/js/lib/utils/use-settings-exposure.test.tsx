import { act, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { recordBoostEvent } from './analytics';
import { useSettingsExposure, useSettingsVisit } from './use-settings-exposure';

jest.mock( './analytics', () => ( { recordBoostEvent: jest.fn() } ) );

const Settings = () => {
	const ref = useRef< HTMLDivElement >( null );
	const visit = useSettingsVisit();
	useSettingsExposure( ref, { visit } );
	return <div ref={ ref }>Settings</div>;
};

let notify: IntersectionObserverCallback;
const originalObserver = globalThis.IntersectionObserver;
const originalResizeObserver = globalThis.ResizeObserver;
const expose = () =>
	act( () =>
		notify(
			[ { isIntersecting: true, intersectionRatio: 1 } as IntersectionObserverEntry ],
			{} as IntersectionObserver
		)
	);

beforeEach( () => {
	jest.mocked( recordBoostEvent ).mockClear();
	globalThis.IntersectionObserver = jest.fn( callback => {
		notify = callback;
		return { observe: jest.fn(), disconnect: jest.fn() };
	} ) as unknown as typeof IntersectionObserver;
} );

afterEach( () => {
	globalThis.IntersectionObserver = originalObserver;
	globalThis.ResizeObserver = originalResizeObserver;
	jest.restoreAllMocks();
} );

it( 'waits for document visibility and records only once when the tab becomes visible', () => {
	const visibility = jest.spyOn( document, 'visibilityState', 'get' ).mockReturnValue( 'hidden' );
	render( <Settings /> );
	expose();
	expect( recordBoostEvent ).not.toHaveBeenCalled();
	visibility.mockReturnValue( 'visible' );
	act( () => document.dispatchEvent( new Event( 'visibilitychange' ) ) );
	expect( recordBoostEvent ).toHaveBeenCalledWith( 'settings_view', {} );
	act( () => document.dispatchEvent( new Event( 'visibilitychange' ) ) );
	expose();
	expect( recordBoostEvent ).toHaveBeenCalledTimes( 1 );
} );

it( 'does not send a queued observer notification after unmount', () => {
	const view = render( <Settings /> );
	view.unmount();
	expose();
	expect( recordBoostEvent ).not.toHaveBeenCalled();
} );

it( 'requires a meaningful visible part of the stack instead of an intersecting sliver', () => {
	jest
		.spyOn( HTMLElement.prototype, 'getBoundingClientRect' )
		.mockReturnValue( { height: window.innerHeight * 2 } as DOMRect );
	render( <Settings /> );
	expect( IntersectionObserver ).toHaveBeenLastCalledWith( expect.any( Function ), {
		threshold: expect.closeTo( 0.05 ),
	} );
	act( () =>
		notify(
			[ { isIntersecting: true, intersectionRatio: 0.001 } as IntersectionObserverEntry ],
			{} as IntersectionObserver
		)
	);
	expect( recordBoostEvent ).not.toHaveBeenCalled();
	act( () =>
		notify(
			[ { isIntersecting: true, intersectionRatio: 0.05 } as IntersectionObserverEntry ],
			{} as IntersectionObserver
		)
	);
	expect( recordBoostEvent ).toHaveBeenCalledTimes( 1 );
} );

it( 'updates the threshold on window resize and ignores notifications from the replaced observer', () => {
	const rect = jest
		.spyOn( HTMLElement.prototype, 'getBoundingClientRect' )
		.mockReturnValue( { height: window.innerHeight * 2 } as DOMRect );
	render( <Settings /> );
	const staleNotify = notify;
	const firstObserver = jest.mocked( IntersectionObserver ).mock.results[ 0 ].value;
	rect.mockReturnValue( { height: window.innerHeight } as DOMRect );
	act( () => window.dispatchEvent( new Event( 'resize' ) ) );
	expect( IntersectionObserver ).toHaveBeenCalledTimes( 2 );
	expect( IntersectionObserver ).toHaveBeenLastCalledWith( expect.any( Function ), {
		threshold: expect.closeTo( 0.1 ),
	} );
	expect( firstObserver.disconnect ).toHaveBeenCalledTimes( 1 );
	act( () =>
		staleNotify(
			[ { isIntersecting: true, intersectionRatio: 1 } as IntersectionObserverEntry ],
			firstObserver
		)
	);
	expect( recordBoostEvent ).not.toHaveBeenCalled();
	expose();
	expect( recordBoostEvent ).toHaveBeenCalledTimes( 1 );
} );

it( 'observes stack resizes and recalculates the exposure threshold', () => {
	let resize: ResizeObserverCallback;
	const observe = jest.fn();
	const disconnect = jest.fn();
	globalThis.ResizeObserver = jest.fn( callback => {
		resize = callback;
		return { observe, disconnect };
	} ) as unknown as typeof ResizeObserver;
	const rect = jest
		.spyOn( HTMLElement.prototype, 'getBoundingClientRect' )
		.mockReturnValue( { height: window.innerHeight * 2 } as DOMRect );
	const view = render( <Settings /> );
	expect( observe ).toHaveBeenCalledWith( screen.getByText( 'Settings' ) );
	rect.mockReturnValue( { height: window.innerHeight * 4 } as DOMRect );
	act( () => resize( [], {} as ResizeObserver ) );
	expect( IntersectionObserver ).toHaveBeenCalledTimes( 2 );
	expect( IntersectionObserver ).toHaveBeenLastCalledWith( expect.any( Function ), {
		threshold: expect.closeTo( 0.025 ),
	} );
	expose();
	expect( recordBoostEvent ).toHaveBeenCalledTimes( 1 );
	view.unmount();
	expect( disconnect ).toHaveBeenCalledTimes( 1 );
} );
