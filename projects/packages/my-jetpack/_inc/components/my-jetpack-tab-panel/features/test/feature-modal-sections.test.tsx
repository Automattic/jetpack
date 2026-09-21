import { render, screen } from '@testing-library/react';
import { FeatureDelivery } from '../feature-delivery';
import { FeaturePaid } from '../feature-paid';
import type { FeatureState } from '../feature-state';

const feature = {
	slug: 'jetpack-forms',
	name: 'Forms',
	in_jetpack: true,
	plugin: '',
	plans: [ { slug: 'complete', name: 'Jetpack Complete' } ],
	paid_product: '',
	paid_highlights: [ 'Secure file uploads' ],
} as unknown as MainFeature;

const moduleState = ( override: false | 'active' | 'inactive', status: 'active' | 'inactive' ) =>
	( {
		feature,
		status,
		control: {
			kind: 'module',
			module: { module: 'contact-form', available: true, activated: status === 'active', override },
		},
	} ) as FeatureState;

describe( 'FeatureDelivery', () => {
	it( 'says why a module a host forced off cannot be turned on, instead of how to', () => {
		render( <FeatureDelivery state={ moduleState( 'inactive', 'inactive' ) } /> );

		expect( screen.getByText( 'How to get it' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Disabled by your host or site administrator' ) ).toBeInTheDocument();
		expect( screen.queryByText( /Activate turns/ ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'In Jetpack' ) ).not.toBeInTheDocument();
	} );

	it( 'still explains how to turn on a module nobody forced', () => {
		render( <FeatureDelivery state={ moduleState( false, 'inactive' ) } /> );

		expect( screen.getByText( /Activate turns Forms on/ ) ).toBeInTheDocument();
	} );
} );

describe( 'FeaturePaid', () => {
	it( 'leaves out "Available in" for a module a host forced off', () => {
		render(
			<FeaturePaid state={ moduleState( 'inactive', 'inactive' ) } onFilterByPlan={ jest.fn() } />
		);

		expect( screen.queryByText( 'Available in' ) ).not.toBeInTheDocument();
	} );

	it( 'keeps "Available in" for a module nobody forced', () => {
		render(
			<FeaturePaid state={ moduleState( false, 'inactive' ) } onFilterByPlan={ jest.fn() } />
		);

		expect( screen.getByText( 'Available in' ) ).toBeInTheDocument();
	} );
} );
