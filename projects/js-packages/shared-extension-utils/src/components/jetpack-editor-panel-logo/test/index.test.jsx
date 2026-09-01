import { getScriptData } from '@automattic/jetpack-script-data';
import { render, screen } from '@testing-library/react';
import JetpackEditorPanelLogo from '../index';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: jest.fn(),
} ) );

jest.mock( '@automattic/jetpack-components', () => ( {
	JetpackLogo: ( { className, title } ) => (
		<div data-testid="jetpack-logo" className={ className } title={ title } />
	),
} ) );

jest.mock( '../style.scss', () => ( {} ) );

describe( 'JetpackEditorPanelLogo', () => {
	beforeEach( () => {
		getScriptData.mockReset();
	} );

	it( 'shows the logo when branding flag is true', () => {
		getScriptData.mockReturnValue( {
			jetpack: { flags: { showJetpackBranding: true } },
		} );

		render( <JetpackEditorPanelLogo /> );
		expect( screen.getByTestId( 'jetpack-logo' ) ).toBeInTheDocument();
	} );

	it( 'hides the logo when branding flag is false', () => {
		getScriptData.mockReturnValue( {
			jetpack: { flags: { showJetpackBranding: false } },
		} );

		const { container } = render( <JetpackEditorPanelLogo /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'shows the logo when flags are undefined (backward compat)', () => {
		getScriptData.mockReturnValue( {} );

		render( <JetpackEditorPanelLogo /> );
		expect( screen.getByTestId( 'jetpack-logo' ) ).toBeInTheDocument();
	} );

	it( 'shows the logo when getScriptData returns undefined', () => {
		getScriptData.mockReturnValue( undefined );

		render( <JetpackEditorPanelLogo /> );
		expect( screen.getByTestId( 'jetpack-logo' ) ).toBeInTheDocument();
	} );
} );
