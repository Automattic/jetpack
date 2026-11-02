import { render, screen } from 'test/test-utils';
import { FeaturesPointer } from '../index';

jest.mock( 'components/settings-card', () => ( {
	__esModule: true,
	default: ( { children } ) => children,
} ) );

jest.mock( 'components/settings-group', () => ( {
	__esModule: true,
	default: ( { children } ) => children,
} ) );

describe( 'FeaturesPointer', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it( 'links to the feature in My Jetpack Features', () => {
		window.JetpackScriptData = { site: { admin_url: 'https://example.com/wp-admin/' } };

		render( <FeaturesPointer header="VideoPress" name="VideoPress" search="videopress" /> );

		expect( screen.getByRole( 'link', { name: 'Open Features' } ) ).toHaveAttribute(
			'href',
			'https://example.com/wp-admin/admin.php?page=my-jetpack#/features?search=videopress'
		);
	} );
} );
