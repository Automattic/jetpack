/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute -- This Jest project does not load jest-dom. */
import { fireEvent, render, screen } from '@testing-library/react';
import { recordBoostEvent } from '$lib/utils/analytics';
import ModernCriticalCssStatus from './modern-critical-css-status';
import type { CriticalCssState } from '../lib/stores/critical-css-state-types';

const mockRegenerate = jest.fn();
jest.mock( '../lib/stores/critical-css-state', () => ( {
	useRegenerateCriticalCssAction: () => ( { mutate: mockRegenerate } ),
} ) );
jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );

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
