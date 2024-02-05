import { render, screen } from '@testing-library/react';
import * as useDismissNotice from '../../../hooks/use-dismiss-notice';
import { AutoConversionNotice } from '../auto-conversion-notice';

// Mock the useDismissNotice hook
jest.mock( '../../../hooks/use-dismiss-notice', () => {
	return jest.fn();
} );

// Mock the usePublicizeConfig hook
jest.mock( '../../../../', () => {
	return {
		usePublicizeConfig: jest.fn( () => ( {
			adminUrl: 'https://example.com/wp-admin',
			jetpackSharingSettingsUrl: 'https://example.com/wp-admin/admin.php?page=sharing',
		} ) ),
	};
} );

const mockUseDismissNotice = ( {
	shouldShowNoticeValue = false,
	dismissNotice = jest.fn(),
	NOTICES = {
		autoConversion: 'auto-conversion-editor-notice',
	},
} ) => {
	jest.spyOn( useDismissNotice, 'default' ).mockImplementation( () => {
		return {
			shouldShowNotice: jest.fn( () => shouldShowNoticeValue ),
			dismissNotice,
			NOTICES,
		};
	} );
};

describe( 'AutoConversionNotice', () => {
	it( 'should render when shouldShowNotice is true', async () => {
		mockUseDismissNotice( { shouldShowNoticeValue: true } );
		const { container } = render( <AutoConversionNotice canChangeSettings={ true } /> );

		expect( container ).not.toBeEmptyDOMElement();
		await expect( screen.findByText( /Got it/i ) ).resolves.toBeInTheDocument();
	} );

	it( 'should not render when shouldShowNotice is false', async () => {
		mockUseDismissNotice( { shouldShowNoticeValue: false } );
		const { container } = render( <AutoConversionNotice canChangeSettings={ true } /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should call dismissNotice when clicking on the Got it button', async () => {
		const dismissNotice = jest.fn();
		mockUseDismissNotice( { shouldShowNoticeValue: true, dismissNotice } );
		render( <AutoConversionNotice canChangeSettings={ true } /> );

		const gotItButton = await screen.findByText( /Got it/i );
		gotItButton.click();

		expect( dismissNotice ).toHaveBeenCalledWith( 'auto-conversion-editor-notice' );
	} );

	it( 'should not render change settings button if canChangeSettings is false', async () => {
		mockUseDismissNotice( { shouldShowNoticeValue: true } );
		const { container } = render( <AutoConversionNotice canChangeSettings={ false } /> );

		expect( container ).not.toBeEmptyDOMElement();
		await expect( screen.findByText( /Got it/i ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( /Change settings/i ) ).not.toBeInTheDocument();
	} );

	it( 'should render change settings button if canChangeSettings is true', async () => {
		mockUseDismissNotice( { shouldShowNoticeValue: true } );
		const { container } = render( <AutoConversionNotice canChangeSettings={ true } /> );

		expect( container ).not.toBeEmptyDOMElement();
		await expect( screen.findByText( /Got it/i ) ).resolves.toBeInTheDocument();
		await expect( screen.findByText( /Change settings/i ) ).resolves.toBeInTheDocument();
	} );
} );
