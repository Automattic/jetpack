import { render, screen } from '@testing-library/react';
import useIsUserConnected from '../../../shared/use-is-user-connected';
import Edit from '../edit';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: () => ( {} ),
	InspectorControls: ( { children } ) => children,
	RichText: () => null,
} ) );

jest.mock( '@wordpress/components', () => ( {
	Button: ( { children, ...props } ) => <button { ...props }>{ children }</button>,
	Placeholder: ( { label, instructions, children } ) => (
		<div>
			<p>{ label }</p>
			<p>{ instructions }</p>
			{ children }
		</div>
	),
	TextControl: () => null,
} ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: () => false,
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
} ) );

jest.mock( '@automattic/jetpack-ai-client', () => ( {
	GuidelineMessage: () => null,
} ) );

jest.mock( '../../../shared/components/connect-banner', () => ( {
	__esModule: true,
	default: () => <div>Connect banner</div>,
} ) );

jest.mock( '../../../shared/use-is-user-connected', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '../components/nudge-enable-search', () => ( {
	__esModule: true,
	default: () => null,
} ) );

jest.mock( '../controls', () => ( {
	AiChatControls: () => null,
} ) );

describe( 'AI Chat block edit', () => {
	const defaultProps = {
		attributes: {},
		setAttributes: jest.fn(),
		clientId: 1,
	};

	afterEach( () => {
		delete window.Jetpack_AIChatBlock;
	} );

	test( 'shows an upgrade prompt on a connected, free-plan site', () => {
		useIsUserConnected.mockReturnValue( true );
		window.Jetpack_AIChatBlock = { jetpackSettings: { supports_paid_search: false } };

		render( <Edit { ...defaultProps } /> );

		expect( screen.getByText( 'Upgrade Jetpack Search' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Connect banner' ) ).not.toBeInTheDocument();
	} );

	test( 'shows the connect banner instead of the upgrade prompt when disconnected', () => {
		useIsUserConnected.mockReturnValue( false );
		window.Jetpack_AIChatBlock = { jetpackSettings: { supports_paid_search: false } };

		render( <Edit { ...defaultProps } /> );

		expect( screen.getByText( 'Connect banner' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Upgrade Jetpack Search' ) ).not.toBeInTheDocument();
	} );
} );
