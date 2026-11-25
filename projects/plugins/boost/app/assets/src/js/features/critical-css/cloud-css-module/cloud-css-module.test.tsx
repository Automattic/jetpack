/* eslint-disable testing-library/prefer-user-event -- This project does not provide user-event. */
import { fireEvent, render, screen } from '@testing-library/react';
import { ModuleSurfaceProvider } from '$features/module/surface';
import { recordBoostEvent } from '$lib/utils/analytics';
import CloudCssModule from './cloud-css-module';
import type { ReactNode } from 'react';

const mockRegenerate = jest.fn();

jest.mock( '$features/module/module', () => ( {
	__esModule: true,
	default: ( { description, onEnable }: { description: ReactNode; onEnable?: () => void } ) => (
		<section>
			<button onClick={ onEnable }>Enable</button>
			{ description }
		</section>
	),
} ) );
jest.mock( '$features/critical-css/cloud-css-meta/cloud-css-meta', () => () => null );
jest.mock( '$features/critical-css/lib/stores/critical-css-state', () => ( {
	useRegenerateCriticalCssAction: () => ( { mutate: mockRegenerate } ),
} ) );
jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );

test( 'regenerates Critical CSS on enable and records the documentation link click', () => {
	render(
		<ModuleSurfaceProvider value="row">
			<CloudCssModule />
		</ModuleSurfaceProvider>
	);

	fireEvent.click( screen.getByRole( 'button', { name: 'Enable' } ) );
	fireEvent.click( screen.getByRole( 'link', { name: /Critical CSS/ } ) );

	expect( mockRegenerate ).toHaveBeenCalledTimes( 1 );
	expect( recordBoostEvent ).toHaveBeenCalledWith( 'critical_css_link_clicked', {} );
} );
