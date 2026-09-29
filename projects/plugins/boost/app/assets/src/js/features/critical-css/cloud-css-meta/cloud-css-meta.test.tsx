/* eslint-disable jest-dom/prefer-in-document -- This Jest project does not load jest-dom. */
import { render, screen } from '@testing-library/react';
import { ModuleSurfaceProvider } from '$features/module/surface';
import CloudCssMeta from './cloud-css-meta';
import type { CriticalCssState } from '../lib/stores/critical-css-state-types';

const generated: CriticalCssState = {
	status: 'generated',
	providers: [
		{ key: 'front', label: 'Front page', urls: [ '/' ], success_ratio: 1, status: 'success' },
		{ key: 'posts', label: 'Posts', urls: [ '/post' ], success_ratio: 0, status: 'error' },
	],
};
jest.mock( '../lib/stores/critical-css-state', () => ( {
	useRegenerateCriticalCssAction: () => ( { mutate: jest.fn() } ),
	useCriticalCssState: () => [ generated ],
} ) );

test( 'shows only the automatic generation note on the modern surface', () => {
	render(
		<ModuleSurfaceProvider value="row">
			<CloudCssMeta />
		</ModuleSurfaceProvider>
	);
	expect(
		screen.getByText(
			'Boost will automatically generate your Critical CSS whenever you make changes.'
		)
	).toBeTruthy();
	expect( screen.queryByRole( 'button', { name: 'Regenerate' } ) ).toBeNull();
	expect( screen.queryByText( /could not be automatically generated/ ) ).toBeNull();
} );

test( 'keeps the generation status on the legacy surface', () => {
	render( <CloudCssMeta /> );
	expect( screen.getByText( /1 file generated/ ) ).toBeTruthy();
} );
