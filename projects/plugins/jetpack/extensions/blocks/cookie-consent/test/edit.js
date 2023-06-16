import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CookieConsentEdit from '../edit';
import { useCookieConsentTemplatePart, openTemplate } from '../util';

jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	useBlockProps: jest.fn().mockReturnValue( {} ),
} ) );

jest.mock( '../util', () => ( {
	createTemplatePart: jest.fn(),
	useCookieConsentTemplatePart: jest.fn(),
	useWarningState: jest.fn(),
	openTemplate: jest.fn(),
} ) );

describe( 'CookieConsentEdit Edit', () => {
	const defaultAttributes = {
		text: 'CookieConsentEdit',
	};
	const setAttributes = jest.fn();

	beforeEach( () => {
		setAttributes.mockClear();
	} );

	afterEach( () => {
		jest.resetAllMocks();
	} );

	describe( 'In warning mode', () => {
		const defaultProps = {
			attributes: { ...defaultAttributes, isInWarningState: true },
			setAttributes: jest.fn(),
		};

		test( 'Returns loading text when template is loading', async () => {
			useCookieConsentTemplatePart.mockReturnValue( { isLoading: true } );

			render( <CookieConsentEdit { ...defaultProps } /> );
			await waitFor( () => {
				expect( screen.getByText( 'Loading…', { exact: false } ) ).toBeInTheDocument();
			} );
		} );

		test( 'Shows go to template button, and navigates on click', async () => {
			const template = { id: 1, type: 'test' };
			useCookieConsentTemplatePart.mockReturnValue( { part: template, isLoading: false } );
			render( <CookieConsentEdit { ...defaultProps } /> );
			await waitFor( () => {
				expect(
					screen.getByText( 'You can only have one cookie consent banner on your site', {
						exact: false,
					} )
				).toBeInTheDocument();
			} );

			await userEvent.click( screen.getByText( 'Go to template part', { exact: false } ) );
			expect( openTemplate ).toHaveBeenCalledWith( template );
		} );

		test( 'Shows create template button, shows crate button', async () => {
			useCookieConsentTemplatePart.mockReturnValue( { part: undefined, isLoading: false } );

			render( <CookieConsentEdit { ...defaultProps } /> );
			await waitFor( () => {
				expect(
					screen.getByText( 'Cookie Consent Block should be added in its own template part', {
						exact: false,
					} )
				).toBeInTheDocument();
			} );

			expect(
				screen.getByText( 'Create the template part', {
					exact: false,
				} )
			).toBeInTheDocument();
		} );
	} );
} );
