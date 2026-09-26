/* eslint-disable jest-dom/prefer-in-document -- This Jest project does not load jest-dom. */
import { render, screen, within } from '@testing-library/react';
import { ModuleSurfaceProvider, type ModuleSurface } from '$features/module/surface';
import Status from './status';
import type { CriticalCssState } from '../lib/stores/critical-css-state-types';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );
jest.mock( './status.module.scss', () => ( {
	status: 'status',
	summary: 'summary',
	successes: 'successes',
	failures: 'failures-legacy',
} ) );
jest.mock( '$svg/info', () => ( {
	__esModule: true,
	default: () => <svg data-testid="legacy-info-icon" />,
} ) );
jest.mock( '../lib/stores/critical-css-state', () => ( {
	useRegenerateCriticalCssAction: () => ( { mutate: jest.fn() } ),
} ) );
jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );

const provider = ( key: string, status: 'success' | 'error' ) => ( {
	key,
	label: key,
	urls: [ `http://localhost/${ key }` ],
	success_ratio: 1,
	status,
	errors:
		status === 'error'
			? [
					{
						url: `http://localhost/${ key }`,
						message: 'x',
						meta: {},
						type: 'UnknownError' as const,
					},
				]
			: undefined,
} );

const partialFailure: CriticalCssState = {
	status: 'generated',
	updated: Date.now() / 1000 - 86400,
	providers: [
		provider( 'a', 'success' ),
		provider( 'b', 'success' ),
		provider( 'c', 'success' ),
		provider( 'd', 'error' ),
		provider( 'e', 'error' ),
	],
};

const renderOn = ( surface: ModuleSurface ) =>
	render(
		<ModuleSurfaceProvider value={ surface }>
			<Status cssState={ partialFailure } isCloud />
		</ModuleSurfaceProvider>
	);

const failureText = /2 files could not be automatically generated/;

test( 'row surface stacks the partial-failure notice, icon included, in the status text column', () => {
	renderOn( 'row' );
	const status = within( screen.getByTestId( 'critical-css-meta' ) );
	const message = status.getByText( failureText );
	expect( screen.queryByTestId( 'legacy-info-icon' ) ).toBeNull();
	expect( status.getByRole( 'link', { name: 'advanced recommendations page' } ) ).toBeTruthy();
	/* eslint-disable testing-library/no-node-access -- The layout under test is DOM nesting, which has no role. */
	const summary = status.getByText( /3 files generated/ ).parentElement as HTMLElement;
	const notice = summary.lastElementChild as HTMLElement;
	expect( notice.contains( message ) ).toBe( true );
	expect( notice.querySelector( 'svg' ) ).not.toBeNull();
	/* eslint-enable testing-library/no-node-access */
} );

test( 'block surface keeps the legacy failure row with its gutter icon', () => {
	renderOn( 'block' );
	const status = within( screen.getByTestId( 'critical-css-meta' ) );
	expect( status.getByText( failureText ) ).toBeTruthy();
	expect( status.getByTestId( 'legacy-info-icon' ) ).toBeTruthy();
} );
