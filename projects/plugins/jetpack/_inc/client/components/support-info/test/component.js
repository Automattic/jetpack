import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

import SupportInfo from '../index';

describe( 'SupportInfo', () => {
	const testProps = {
		text: 'Hello world!',
		link: 'https://foo.com/',
		privacyLink: 'https://foo.com/privacy/',
	};

	const wrapper = shallow( <SupportInfo { ...testProps } /> );

	it( 'should have a proper "Learn more" link', () => {
		expect( wrapper.find( 'ForwardRef(ExternalLink)' ).get( 0 ).props.href ).to.be.equal(
			'https://foo.com/'
		);
	} );

	it( 'should have a proper "Privacy Information" link', () => {
		expect( wrapper.find( 'ForwardRef(ExternalLink)' ).get( 1 ).props.href ).to.be.equal(
			'https://foo.com/privacy/'
		);
	} );
} );
