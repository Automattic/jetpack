const mockReaderChatControl = jest.fn();

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		tracks: {
			recordEvent: jest.fn(),
		},
	},
} ) );

jest.mock( '@automattic/jetpack-components', () => ( {
	getProductCheckoutUrl: jest.fn( () => 'https://example.com/checkout' ),
} ) );

jest.mock( '@automattic/jetpack-connection', () => ( {
	useConnection: () => ( { isUserConnected: true } ),
} ) );

jest.mock( '@wordpress/components', () => ( {
	Button: ( { children, disabled, href } ) => (
		<a data-disabled={ disabled } href={ href }>
			{ children }
		</a>
	),
	ToggleControl: ( { checked, disabled, label } ) => {
		const labelText = String( label );
		const testId = labelText.includes( 'instant search' )
			? 'instant-search-toggle'
			: 'search-toggle';

		return (
			<div data-checked={ checked } data-disabled={ disabled } data-testid={ testId }>
				{ labelText }
			</div>
		);
	},
} ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: callback => callback( () => ( { isWpcom: () => false } ) ),
} ) );

jest.mock( '@wordpress/element', () => ( {
	createInterpolateElement: text => text.replace( '<span>', '' ).replace( '</span>', '' ),
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
	sprintf: text => text,
} ) );

jest.mock( 'components/card', () => ( {
	__esModule: true,
	default: ( { children } ) => <div data-testid="search-settings-card">{ children }</div>,
} ) );

jest.mock( 'components/reader-chat-control', () => props => {
	mockReaderChatControl( props );
	return <div data-testid="reader-chat-control" />;
} );

jest.mock( 'components/upsell-nudge', () => () => <div data-testid="instant-search-upsell" /> );

jest.mock( 'store', () => ( {
	STORE_ID: 'jetpack-search-plugin',
} ) );

import { render, screen } from '@testing-library/react';
import ModuleControl from '../index.jsx';

const defaultProps = {
	siteAdminUrl: 'https://example.com/wp-admin/',
	updateOptions: jest.fn(),
	domain: 'example.com',
	isDisabledFromOverLimit: false,
	isSavingEitherOption: false,
	isModuleEnabled: true,
	isInstantSearchEnabled: true,
	isInstantSearchPromotionActive: false,
	isReaderChatAvailable: true,
	isReaderChatEnabled: true,
	supportsOnlyClassicSearch: false,
	supportsSearch: true,
	supportsInstantSearch: true,
	isTogglingModule: false,
	isTogglingInstantSearch: false,
	readerChatGuidelinesUrl:
		'https://example.com/wp-admin/options-general.php?page=guidelines-wp-admin',
};

describe( 'ModuleControl', () => {
	beforeEach( () => {
		mockReaderChatControl.mockClear();
	} );

	test( 'renders the Reader Chat control after the Instant Search setting', () => {
		render( <ModuleControl { ...defaultProps } /> );

		expect( screen.getAllByTestId( /^(instant-search-toggle|reader-chat-control)$/ ) ).toEqual( [
			screen.getByTestId( 'instant-search-toggle' ),
			screen.getByTestId( 'reader-chat-control' ),
		] );
		expect( mockReaderChatControl ).toHaveBeenCalledWith(
			expect.objectContaining( {
				isAvailable: true,
				isEnabled: true,
				isSaving: false,
				guidelinesUrl: 'https://example.com/wp-admin/options-general.php?page=guidelines-wp-admin',
				updateOptions: defaultProps.updateOptions,
			} )
		);
	} );
} );
