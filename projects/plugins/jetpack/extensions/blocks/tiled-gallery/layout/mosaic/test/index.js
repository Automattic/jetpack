import { render } from '@testing-library/react';
import { range } from 'lodash';
import React from 'react';
import Mosaic from '..';
import * as imageSets from '../../test/fixtures/image-sets';

test.each( Object.entries( imageSets ) )( 'renders as expected (set %s)', ( k, images ) => {
	const { container } = render(
		<Mosaic images={ images } renderedImages={ range( images.length ) } />
	);
	expect( container ).toMatchSnapshot( 'images' );
} );
