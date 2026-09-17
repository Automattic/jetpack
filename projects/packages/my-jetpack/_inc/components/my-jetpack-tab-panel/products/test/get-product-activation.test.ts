import { PRODUCT_STATUSES } from '../../../../constants';
import { getProductActivation } from '../product-card-action';
import type { ProductCamelCase } from '../../../../data/types';
import type { MyJetpackModule } from '../../../../types';

const buildProduct = ( overrides = {} ) =>
	( {
		slug: 'stats',
		name: 'Stats',
		status: PRODUCT_STATUSES.ACTIVE,
		hasPaidPlanForProduct: true,
		...overrides,
	} ) as unknown as ProductCamelCase;

const buildModule = ( overrides = {} ) =>
	( { available: true, activated: true, ...overrides } ) as unknown as MyJetpackModule;

describe( 'getProductActivation', () => {
	it( 'offers a toggle for a product that is running', () => {
		expect( getProductActivation( buildProduct(), buildModule(), true, false ) ).toEqual( {
			disabled: false,
			reloadOnToggle: false,
		} );
	} );

	it.each( [
		PRODUCT_STATUSES.INACTIVE,
		PRODUCT_STATUSES.MODULE_DISABLED,
		PRODUCT_STATUSES.NEEDS_ACTIVATION,
		PRODUCT_STATUSES.ABSENT_WITH_PLAN,
		PRODUCT_STATUSES.ABSENT,
		PRODUCT_STATUSES.NEEDS_PLAN,
	] )( 'offers no toggle at status %s, so the caller upsells instead', status => {
		expect(
			getProductActivation( buildProduct( { status } ), buildModule(), true, false )
		).toBeNull();
	} );

	it( 'offers no toggle without a paid plan or an interstitial', () => {
		const product = buildProduct( { hasPaidPlanForProduct: false } );

		expect( getProductActivation( product, buildModule(), false, false ) ).toBeNull();
	} );

	it( 'disables the toggle when the module behind the product is unavailable', () => {
		const activation = getProductActivation(
			buildProduct(),
			buildModule( { available: false } ),
			true,
			false
		);

		expect( activation ).toMatchObject( { disabled: true } );
	} );

	it( 'reads a standalone-plugin product from the plugin, not the product status', () => {
		const product = buildProduct( {
			slug: 'boost',
			status: PRODUCT_STATUSES.ACTIVE,
			standalonePluginInfo: { isStandaloneInstalled: true, isStandaloneActive: false },
		} );

		expect( getProductActivation( product, undefined, true, false ) ).toMatchObject( {
			active: false,
		} );
	} );

	it( 'reloads after toggling a product that changes the admin sidebar', () => {
		const product = buildProduct( { slug: 'videopress' } );

		expect( getProductActivation( product, buildModule(), true, false ) ).toMatchObject( {
			reloadOnToggle: true,
		} );
	} );

	it( 'offers the Forms toggle even though it has no plan or interstitial', () => {
		const product = buildProduct( { slug: 'jetpack-forms', hasPaidPlanForProduct: false } );

		expect( getProductActivation( product, buildModule(), false, false ) ).toMatchObject( {
			active: true,
		} );
	} );

	it( 'gates the AI master toggle behind the pre-release flag', () => {
		const product = buildProduct( {
			slug: 'jetpack-ai',
			status: PRODUCT_STATUSES.NEEDS_PLAN,
			hasPaidPlanForProduct: false,
		} );

		expect( getProductActivation( product, buildModule(), false, false ) ).toBeNull();
		expect( getProductActivation( product, buildModule(), false, true ) ).toMatchObject( {
			active: true,
		} );
	} );
} );
