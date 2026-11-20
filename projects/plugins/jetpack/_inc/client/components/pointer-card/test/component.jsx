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

	it.each( [
		[ 'searches My Jetpack Features', { search: 'videopress' }, 'search=videopress' ],
		[
			'opens a card in My Jetpack Features',
			{ feature: 'jetpack-forms' },
			'feature=jetpack-forms',
		],
	] )( '%s', ( _label, props, query ) => {
		window.JetpackScriptData = { site: { admin_url: 'https://example.com/wp-admin/' } };

		render( <FeaturesPointer header="VideoPress" name="VideoPress" { ...props } /> );

		expect( screen.getByRole( 'link', { name: 'Open Features' } ) ).toHaveAttribute(
			'href',
			`https://example.com/wp-admin/admin.php?page=my-jetpack#/features?${ query }`
		);
	} );

	it.each( [
		[
			'mentions the settings Features links to by default',
			undefined,
			'Turn VideoPress on or off in My Jetpack › Features, which links to its settings.',
		],
		[
			'mentions only the switch without settings',
			false,
			'Turn VideoPress on or off in My Jetpack › Features.',
		],
	] )( '%s', ( _label, linksToSettings, text ) => {
		render(
			<FeaturesPointer
				header="VideoPress"
				name="VideoPress"
				search="videopress"
				linksToSettings={ linksToSettings }
			/>
		);

		expect( screen.getByText( text ) ).toBeInTheDocument();
	} );
} );
