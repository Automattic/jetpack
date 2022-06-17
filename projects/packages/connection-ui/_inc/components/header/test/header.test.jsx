import React from 'react';
import renderer from 'react-test-renderer';
import '@testing-library/jest-dom/extend-expect';
import Header from '../index';

test( 'Displays the header', () => {
	const tree = renderer.create( <Header /> ).toJSON();
	expect( tree ).toMatchSnapshot();
} );
