import apiFetch from '@wordpress/api-fetch';
import { PRODUCT_TYPE_PAYMENT_PLAN } from '../../../shared/components/product-management-controls/constants';
import * as message from '../../../shared/components/product-management-controls/utils';
import * as currencies from '../../../shared/currencies';
import {
	saveProduct,
	setApiState,
	setConnectUrl,
	setProducts,
	setShouldUpgrade,
	setSiteSlug,
	setUpgradeUrl,
} from '../actions';
import * as utils from '../utils';

const ANY_VALID_DATA = {
	anyProductProperty: 'anyValue',
};

const buildAnyValidProduct = () => ( {
	title: 'anyTitle',
	price: '123',
	currency: 'USD',
} );

const anyFunction = () => {};

jest.mock( '@wordpress/api-fetch' );

describe( 'Membership Products Actions', () => {
	beforeEach( () => jest.clearAllMocks() );

	test( 'Set products works as expected', () => {
		// Given
		const anyValidProductWithType = {
			type: 'SET_PRODUCTS',
			products: ANY_VALID_DATA,
		};

		// When
		const result = setProducts( ANY_VALID_DATA );

		// Then
		expect( result ).toStrictEqual( anyValidProductWithType );
	} );

	test( 'Set ConnectUrl works as expected', () => {
		// Given
		const anyValidConnectUrlWithType = {
			type: 'SET_CONNECT_URL',
			connectUrl: ANY_VALID_DATA,
		};

		// When
		const result = setConnectUrl( ANY_VALID_DATA );

		// Then
		expect( result ).toStrictEqual( anyValidConnectUrlWithType );
	} );

	test( 'Set apiState works as expected', () => {
		// Given
		const anyValidApiStateWithType = {
			type: 'SET_API_STATE',
			apiState: ANY_VALID_DATA,
		};

		// When
		const result = setApiState( ANY_VALID_DATA );

		// Then
		expect( result ).toStrictEqual( anyValidApiStateWithType );
	} );

	test( 'Set shouldUpgrade works as expected', () => {
		// Given
		const anyValidShouldUpgradeWithType = {
			type: 'SET_SHOULD_UPGRADE',
			shouldUpgrade: ANY_VALID_DATA,
		};

		// When
		const result = setShouldUpgrade( ANY_VALID_DATA );

		// Then
		expect( result ).toStrictEqual( anyValidShouldUpgradeWithType );
	} );

	test( 'setSiteSlug works as expected', () => {
		// Given
		const anyValidSiteSlugWithType = {
			type: 'SET_SITE_SLUG',
			siteSlug: ANY_VALID_DATA,
		};

		// When
		const result = setSiteSlug( ANY_VALID_DATA );

		// Then
		expect( result ).toStrictEqual( anyValidSiteSlugWithType );
	} );

	test( 'setUpgradeUrl works as expected', () => {
		// Given
		const anyValidSiteSlugWithType = {
			type: 'SET_UPGRADE_URL',
			upgradeUrl: ANY_VALID_DATA,
		};

		// When
		const result = setUpgradeUrl( ANY_VALID_DATA );

		// Then
		expect( result ).toStrictEqual( anyValidSiteSlugWithType );
	} );

	const productsForTitleTesting = [
		{
			name: 'saving a product without a title triggers an error notice.',
			product: { price: 1 },
		},
		{
			name: 'saving a product with a title of length 0 triggers an error notice.',
			product: { price: 1, title: '' },
		},
	];

	test.each( productsForTitleTesting )( '$name', async testCase => {
		// Given
		const selectedProductIdCallback = anyFunction;
		const paymentPlanProductType = PRODUCT_TYPE_PAYMENT_PLAN;
		const noticeMock = jest.spyOn( utils, 'onError' ).mockImplementation( anyFunction );
		const getMessageMock = jest
			.spyOn( message, 'getMessageByProductType' )
			.mockImplementation( anyFunction );

		// When
		await saveProduct(
			testCase.product,
			paymentPlanProductType,
			selectedProductIdCallback
		)( anyFunction, anyFunction );

		// Then
		expect( noticeMock ).toHaveBeenCalled();
		expect( getMessageMock ).toHaveBeenCalledWith(
			'product requires a name',
			paymentPlanProductType
		);
	} );

	test( 'having a price below the minimum price triggers an error notice.', async () => {
		// Given
		const ANY_MINIMUM_CURRENCY_AMOUNT = 123;
		const productWithValueBelowMin = buildAnyValidProduct();
		const paymentPlanProductType = PRODUCT_TYPE_PAYMENT_PLAN;
		productWithValueBelowMin.price = ANY_MINIMUM_CURRENCY_AMOUNT - 1;
		const noticeMock = jest.spyOn( utils, 'onError' ).mockImplementation( anyFunction );
		jest
			.spyOn( currencies, 'minimumTransactionAmountForCurrency' )
			.mockImplementation( () => ANY_MINIMUM_CURRENCY_AMOUNT );

		// When
		await saveProduct(
			productWithValueBelowMin,
			paymentPlanProductType,
			anyFunction
		)( anyFunction, anyFunction );

		// Then
		expect( noticeMock ).toHaveBeenCalled();
	} );

	test( 'an invalid product price triggers an error notice.', async () => {
		// Given
		const productWithInvalidPrice = buildAnyValidProduct();
		productWithInvalidPrice.price = 'anyInvalidPrice';
		const paymentPlanProductType = PRODUCT_TYPE_PAYMENT_PLAN;
		const noticeMock = jest.spyOn( utils, 'onError' ).mockImplementation( anyFunction );
		const getMessageMock = jest
			.spyOn( message, 'getMessageByProductType' )
			.mockImplementation( anyFunction );

		// When
		await saveProduct(
			productWithInvalidPrice,
			paymentPlanProductType,
			anyFunction
		)( anyFunction, anyFunction );

		// Then
		expect( noticeMock ).toHaveBeenCalled();
		expect( getMessageMock ).toHaveBeenCalledWith(
			'product requires a valid price',
			paymentPlanProductType
		);
	} );

	test( 'Happy case displays a success notice.', async () => {
		// Given
		const anyValidProduct = buildAnyValidProduct();
		const paymentPlanProductType = PRODUCT_TYPE_PAYMENT_PLAN;
		const selectedProductCallback = jest.fn( anyFunction );
		const apiResponseProduct = {
			id: 1,
			title: 'anyTitle',
			interval: 'anyInterval',
			price: '12',
			currency: 'anyCurrency',
		};
		const registryProductList = [ apiResponseProduct, apiResponseProduct ];
		const registry = {
			select: () => ( { getProducts: () => registryProductList } ),
		};
		const dispatch = jest.fn( anyFunction );
		const noticeMock = jest.spyOn( utils, 'onSuccess' ).mockImplementation( anyFunction );
		const getMessageMock = jest
			.spyOn( message, 'getMessageByProductType' )
			.mockImplementation( anyFunction );
		apiFetch.mockReturnValue( Promise.resolve( apiResponseProduct ) );

		// When
		await saveProduct(
			anyValidProduct,
			paymentPlanProductType,
			selectedProductCallback
		)( { dispatch, registry } );

		// Then
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wpcom/v2/memberships/product',
			method: 'POST',
			data: anyValidProduct,
		} );
		expect( dispatch ).toHaveBeenCalledWith( {
			products: registryProductList.concat( [ apiResponseProduct ] ),
			type: 'SET_PRODUCTS',
		} );
		expect( selectedProductCallback ).toHaveBeenCalledWith( apiResponseProduct.id );
		expect( noticeMock ).toHaveBeenCalled();
		expect( getMessageMock ).toHaveBeenCalledWith(
			'successfully created product',
			PRODUCT_TYPE_PAYMENT_PLAN
		);
	} );

	test( 'If we fail to retrieve data from the memberships API we display an error notice.', async () => {
		// Given
		const anyValidProduct = buildAnyValidProduct();
		const paymentPlanProductType = PRODUCT_TYPE_PAYMENT_PLAN;
		const noticeMock = jest.spyOn( utils, 'onError' ).mockImplementation( anyFunction );
		const getMessageMock = jest
			.spyOn( message, 'getMessageByProductType' )
			.mockImplementation( anyFunction );
		apiFetch.mockReturnValue( Promise.reject( 'anyErrorMessage' ) );

		// When
		await saveProduct(
			anyValidProduct,
			paymentPlanProductType,
			anyFunction
		)( anyFunction, anyFunction );

		// Then
		expect( noticeMock ).toHaveBeenCalled();
		expect( getMessageMock ).toHaveBeenCalledWith(
			'there was an error when adding the product',
			PRODUCT_TYPE_PAYMENT_PLAN
		);
	} );
} );
