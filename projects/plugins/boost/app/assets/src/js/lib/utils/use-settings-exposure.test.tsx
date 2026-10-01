import { act, render } from '@testing-library/react';
import { StrictMode, useRef } from 'react';
import { recordBoostEvent } from './analytics';
import { useSettingsExposure } from './use-settings-exposure';

jest.mock( './analytics', () => ( { recordBoostEvent: jest.fn() } ) );

const LegacySettings = ( { hidden = false }: { hidden?: boolean } ) => {
	const ref = useRef< HTMLDivElement >( null );
	useSettingsExposure( ref );
	return (
		<div ref={ ref } hidden={ hidden }>
			Legacy settings
		</div>
	);
};

it( 'deduplicates legacy visibility across StrictMode and scrolling, then records a new route visit', () => {
	const original = globalThis.IntersectionObserver;
	let notify: IntersectionObserverCallback;
	globalThis.IntersectionObserver = jest.fn( callback => {
		notify = callback;
		return { observe: jest.fn(), disconnect: jest.fn() };
	} ) as unknown as typeof IntersectionObserver;
	const expose = () =>
		act( () =>
			notify(
				[ { isIntersecting: true, intersectionRatio: 1 } as IntersectionObserverEntry ],
				{} as IntersectionObserver
			)
		);

	try {
		const view = render(
			<StrictMode>
				<LegacySettings hidden />
			</StrictMode>
		);
		expose();
		expect( recordBoostEvent ).not.toHaveBeenCalled();
		view.rerender(
			<StrictMode>
				<LegacySettings />
			</StrictMode>
		);
		expose();
		expose();
		expect( recordBoostEvent ).toHaveBeenCalledTimes( 1 );
		expect( recordBoostEvent ).toHaveBeenCalledWith( 'settings_view', {} );
		view.unmount();
		render(
			<StrictMode>
				<LegacySettings />
			</StrictMode>
		);
		expose();
		expect( recordBoostEvent ).toHaveBeenCalledTimes( 2 );
	} finally {
		globalThis.IntersectionObserver = original;
	}
} );
