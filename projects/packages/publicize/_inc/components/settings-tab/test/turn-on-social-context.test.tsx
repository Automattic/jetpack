import { renderHook } from '@testing-library/react';
import { TurnOnSocialProvider, useTurnOnSocial } from '../turn-on-social-context';
import type { ReactNode } from 'react';

describe( 'useTurnOnSocial', () => {
	it( 'returns an inert default outside a provider', () => {
		const { result } = renderHook( () => useTurnOnSocial() );

		expect( result.current.isEnabling ).toBe( false );
		expect( () => result.current.turnOn() ).not.toThrow();
	} );

	it( 'exposes the provided value inside a provider', () => {
		const turnOn = jest.fn();
		const wrapper = ( { children }: { children: ReactNode } ) => (
			<TurnOnSocialProvider value={ { isEnabling: true, turnOn } }>
				{ children }
			</TurnOnSocialProvider>
		);

		const { result } = renderHook( () => useTurnOnSocial(), { wrapper } );

		expect( result.current.isEnabling ).toBe( true );
		result.current.turnOn();
		expect( turnOn ).toHaveBeenCalledTimes( 1 );
	} );
} );
