import { isPublicizeEnabled, togglePublicizeFeature } from '..';
import { initEditor, resetEditor } from '../test-utils';

describe( 'togglePublicizeFeature', () => {
	beforeEach( () => {
		initEditor();
	} );

	afterEach( () => {
		resetEditor( {
			meta: {
				jetpack_publicize_message: '',
			},
		} );
	} );

	it( 'toggles the feature ON and OFF', () => {
		const valueBeforeToggle = isPublicizeEnabled();

		togglePublicizeFeature();

		const valueAfterToggle = isPublicizeEnabled();

		expect( valueBeforeToggle ).toBe( ! valueAfterToggle );

		togglePublicizeFeature();

		const valueAfterSecondToggle = isPublicizeEnabled();

		expect( valueAfterToggle ).toBe( ! valueAfterSecondToggle );
	} );
} );
