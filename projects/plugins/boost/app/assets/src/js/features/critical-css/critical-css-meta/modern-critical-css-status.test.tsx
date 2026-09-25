/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute -- This Jest project does not load jest-dom. */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ModuleSurfaceProvider } from '$features/module/surface';
import CriticalCssMeta from './critical-css-meta';
import { recordBoostEvent } from '$lib/utils/analytics';
import ModernCriticalCssStatus from './modern-critical-css-status';
import type { CriticalCssState } from '../lib/stores/critical-css-state-types';

const mockRegenerate = jest.fn();
let mockRegenerationReason: string | null = 'switched_theme';
jest.mock( '../lib/stores/critical-css-state', () => ( {
	useRegenerateCriticalCssAction: () => ( { mutate: mockRegenerate } ),
	useCriticalCssState: () => [ { status: 'not_generated', providers: [] } ],
} ) );
jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );

jest.mock( '../lib/stores/suggest-regenerate', () => ( {
	useRegenerationReason: () => [ { data: mockRegenerationReason } ],
} ) );
jest.mock( '../critical-css-context/critical-css-context-provider', () => ( {
	useLocalCriticalCssGenerator: () => ( { isGenerating: false, progress: 0 } ),
} ) );

const generated: CriticalCssState = {
	status: 'generated',
	providers: [
		{ key: 'front', label: 'Front page', urls: [ '/' ], success_ratio: 1, status: 'success' },
	],
};

test( 'shows progress while generating, then the generated summary and regeneration action', () => {
	const { rerender } = render(
		<ModernCriticalCssStatus cssState={ generated } isGenerating progress={ 75 } />
	);
	expect( screen.getByRole( 'progressbar' ).getAttribute( 'aria-valuenow' ) ).toBe( '75' );
	expect( screen.queryByRole( 'button', { name: 'Regenerate' } ) ).toBeNull();
	rerender(
		<ModernCriticalCssStatus cssState={ generated } isGenerating={ false } progress={ 100 } />
	);
	expect( screen.getByText( /1 file generated/ ) ).toBeTruthy();
	// eslint-disable-next-line testing-library/prefer-user-event -- This project does not provide user-event.
	fireEvent.click( screen.getByRole( 'button', { name: 'Regenerate' } ) );
	expect( mockRegenerate ).toHaveBeenCalledTimes( 1 );
	expect( recordBoostEvent ).toHaveBeenCalledWith( 'critical_css_regenerate_clicked', {} );
} );

test( 'shows partial failures with a warning and the existing recommendations destination and event', () => {
	const state: CriticalCssState = {
		...generated,
		providers: [
			...generated.providers,
			{
				key: 'posts',
				label: 'Posts',
				urls: [ '/post' ],
				success_ratio: 1,
				status: 'error',
				errors: [ { type: 'UnknownError', url: '/post', message: 'Failed', meta: {} } ],
			},
		],
	};
	render( <ModernCriticalCssStatus cssState={ state } isGenerating={ false } progress={ 100 } /> );
	expect( screen.getByText( /1 file generated/ ) ).toBeTruthy();
	expect(
		screen.getByText( /1 file could not be automatically generated/, { selector: 'span' } )
			.parentElement?.className
	).toContain( 'is-warning' );
	const link = screen.getByRole( 'link', { name: 'this page' } );
	expect( link.getAttribute( 'href' ) ).toBe( '#/critical-css-advanced' );
	// eslint-disable-next-line testing-library/prefer-user-event -- This project does not provide user-event.
	fireEvent.click( link );
	expect( recordBoostEvent ).toHaveBeenCalledWith( 'critical_css_advanced_link_clicked', {} );
} );

test( 'shows an idle regeneration suggestion only when an invalidation reason exists', () => {
	mockRegenerationReason = 'switched_theme';
	const meta = (
		<ModuleSurfaceProvider value="row">
			<CriticalCssMeta />
		</ModuleSurfaceProvider>
	);
	const { rerender } = render( meta );
	expect(
		screen.getByText(
			"We noticed you've recently updated your theme that may affect your site's HTML/CSS structure."
		)
	).toBeTruthy();
	expect( screen.getByRole( 'button', { name: 'Generate', exact: true } ) ).toBeTruthy();
	mockRegenerationReason = null;
	rerender(
		<ModuleSurfaceProvider value="row">
			<CriticalCssMeta />
		</ModuleSurfaceProvider>
	);
	expect( screen.queryByText( 'Regenerate Critical CSS' ) ).toBeNull();
} );

test( 'opens the Critical CSS info icon with its explanatory text', async () => {
	render(
		<ModernCriticalCssStatus cssState={ generated } isGenerating={ false } progress={ 100 } />
	);
	const icon = within( screen.getByTestId( 'icon-tooltip_wrapper' ) ).getByRole( 'button' );
	// eslint-disable-next-line testing-library/prefer-user-event -- This project does not provide user-event.
	fireEvent.click( icon );
	await expect(
		// speak() also writes this text into `@wordpress/a11y`'s live region; match the tooltip only.
		screen.findByText(
			'Critical CSS is the small set of styles needed to show the top of each page. Boost loads it first so pages appear faster while the rest of the CSS loads.',
			{ ignore: '#a11y-speak-polite, script, style' }
		)
	).resolves.toBeTruthy();
} );
