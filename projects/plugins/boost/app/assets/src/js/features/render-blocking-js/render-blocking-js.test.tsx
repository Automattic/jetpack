/* eslint-disable testing-library/prefer-user-event -- This project does not provide user-event. */
import { fireEvent, render, screen } from '@testing-library/react';
import { recordBoostEvent } from '$lib/utils/analytics';
import RenderBlockingJs from './render-blocking-js';
import type { ReactNode } from 'react';

jest.mock( '$features/module/module', () => ( {
	__esModule: true,
	default: ( { description }: { description: ReactNode } ) => <section>{ description }</section>,
} ) );
jest.mock( '$features/render-blocking-js/render-blocking-js-meta', () => () => null );
jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );

test( 'records the web.dev documentation link click', () => {
	render( <RenderBlockingJs /> );

	fireEvent.click( screen.getByRole( 'link', { name: /web\.dev/ } ) );

	expect( recordBoostEvent ).toHaveBeenCalledWith( 'defer_js_link_clicked', {} );
} );
