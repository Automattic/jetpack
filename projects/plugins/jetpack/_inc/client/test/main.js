import React from 'react';
import { Provider } from 'react-redux';
import store from 'state/redux-store';
import Main from '../main';

describe( 'Main', () => {
	// @todo: This has apparently never actually tested the rendering of Main, due to the use of enzyme's `shallow()` it only tests that `<Provider store={ store }>` will render without throwing.
	// The `expect( component.find( 'Main' ) ).toBeDefined()` doesn't even test anything, as the empty result set returned by `.find()` is still considered "defined".
	// Actually rendering Main depends on a _ton_ of state. What's really intended here?
	it.skip( 'should render the Main component', () => {
		// eslint-disable-next-line no-undef -- Leave bogus "shallow" call for the TODO above.
		const component = shallow(
			<Provider store={ store }>
				<Main />
			</Provider>
		);
		expect( component.find( 'Main' ) ).toBeDefined();
	} );
} );
