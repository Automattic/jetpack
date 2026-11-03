/* No jest-dom in this project. */
/* eslint-disable jest-dom/prefer-empty, jest-dom/prefer-in-document */
import { render, screen } from '@testing-library/react';
import { ComponentProps } from 'react';
import Health from './health';

jest.mock( '$features/module/lib/stores', () => ( {
	useSingleModuleState: () => [ mockState, jest.fn() ],
} ) );

let mockState: { active: boolean; available: boolean } | undefined;

const boostGlobal = { site: { host: '' } };

const cacheSetup = { isError: false, mutate: jest.fn() } as unknown as ComponentProps<
	typeof Health
>[ 'cacheSetup' ];

const renderHealth = () =>
	render(
		<Health
			cacheSetup={ cacheSetup }
			error={ { code: 'advanced-cache-incompatible', message: 'Existing cache' } }
			setError={ jest.fn() }
		/>
	);

describe( 'Health', () => {
	beforeEach( () => {
		mockState = { active: false, available: false };
		boostGlobal.site.host = '';
		( globalThis as unknown as { Jetpack_Boost: typeof boostGlobal } ).Jetpack_Boost = boostGlobal;
	} );

	it.each( [ 'woa', 'atomic' ] )(
		'hides a setup error for the unavailable module when the host is %s',
		host => {
			boostGlobal.site.host = host;

			const { container } = renderHealth();

			expect( container.innerHTML ).toBe( '' );
		}
	);

	it( 'shows a setup error on other hosts', () => {
		boostGlobal.site.host = 'other';

		renderHealth();

		expect( screen.getByText( 'Existing Cache System Detected' ) ).toBeTruthy();
	} );

	it( 'shows a setup error on the Atomic platform while the module is available', () => {
		mockState = { active: false, available: true };
		boostGlobal.site.host = 'atomic';

		renderHealth();

		expect( screen.getByText( 'Existing Cache System Detected' ) ).toBeTruthy();
	} );
} );
