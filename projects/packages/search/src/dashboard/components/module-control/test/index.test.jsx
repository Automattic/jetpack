const mockAIAgentAccessControl = jest.fn();
const mockReaderChatControl = jest.fn();
const mockSearchSuggestionsControl = jest.fn();

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

jest.mock( 'components/ai-agent-access-control', () => props => {
	mockAIAgentAccessControl( props );
	return <div data-testid="ai-agent-access-control" />;
} );

jest.mock( 'components/reader-chat-control', () => props => {
	mockReaderChatControl( props );
	return <div data-testid="reader-chat-control" />;
} );

jest.mock( 'components/search-suggestions-control', () => props => {
	mockSearchSuggestionsControl( props );
	return <div data-testid="search-suggestions-control" />;
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
	isAIAgentAccessAvailable: true,
	isReaderChatAvailable: true,
	isReaderChatEnabled: true,
	supportsOnlyClassicSearch: false,
	supportsSearch: true,
	supportsInstantSearch: true,
	isTogglingModule: false,
	isTogglingInstantSearch: false,
	isSearchSuggestionsEnabled: false,
	aiAgentAccessGuidelinesUrl:
		'https://example.com/wp-admin/options-general.php?page=guidelines-wp-admin',
	readerChatGuidelinesUrl:
		'https://example.com/wp-admin/options-general.php?page=guidelines-wp-admin',
};

describe( 'ModuleControl', () => {
	beforeEach( () => {
		mockAIAgentAccessControl.mockClear();
		mockReaderChatControl.mockClear();
		mockSearchSuggestionsControl.mockClear();
	} );

	test( 'renders Reader Chat, AI Agent Access, and Search Suggestions after the Instant Search setting', () => {
		render( <ModuleControl { ...defaultProps } /> );

		expect(
			screen.getAllByTestId(
				/^(instant-search-toggle|reader-chat-control|ai-agent-access-control|search-suggestions-control)$/
			)
		).toEqual( [
			screen.getByTestId( 'instant-search-toggle' ),
			screen.getByTestId( 'reader-chat-control' ),
			screen.getByTestId( 'ai-agent-access-control' ),
			screen.getByTestId( 'search-suggestions-control' ),
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
		expect( mockAIAgentAccessControl ).toHaveBeenCalledWith(
			expect.objectContaining( {
				isAvailable: true,
				guidelinesUrl: 'https://example.com/wp-admin/options-general.php?page=guidelines-wp-admin',
				showGuidelinesLink: false,
			} )
		);
		expect( mockSearchSuggestionsControl ).toHaveBeenCalledWith(
			expect.objectContaining( {
				isEnabled: false,
				isInstantSearchEnabled: true,
				supportsInstantSearch: true,
				isSaving: false,
				isDisabledFromOverLimit: false,
				updateOptions: defaultProps.updateOptions,
			} )
		);
	} );

	test( 'shows the AI Agent Access guidelines link when Reader Chat is disabled', () => {
		render( <ModuleControl { ...defaultProps } isReaderChatEnabled={ false } /> );

		expect( mockAIAgentAccessControl ).toHaveBeenCalledWith(
			expect.objectContaining( {
				showGuidelinesLink: true,
			} )
		);
	} );

	test( 'does not expose Reader Chat controls when Search is not supported', () => {
		render( <ModuleControl { ...defaultProps } supportsSearch={ false } /> );

		expect( mockReaderChatControl ).toHaveBeenCalledWith(
			expect.objectContaining( {
				isAvailable: false,
			} )
		);
		expect( mockAIAgentAccessControl ).toHaveBeenCalledWith(
			expect.objectContaining( {
				showGuidelinesLink: true,
			} )
		);
	} );

	test( 'disables Reader Chat controls when the Search module group is over limit', () => {
		render( <ModuleControl { ...defaultProps } isDisabledFromOverLimit /> );

		expect( mockReaderChatControl ).toHaveBeenCalledWith(
			expect.objectContaining( {
				isSaving: true,
			} )
		);
	} );
} );
