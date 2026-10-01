import { act, render } from '@testing-library/react';
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
