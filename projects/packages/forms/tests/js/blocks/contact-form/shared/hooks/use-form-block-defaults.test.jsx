import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';

const markNextChangeAsNotPersistent = jest.fn();
let integrations = [];

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	createReduxStore: jest.fn(),
	register: jest.fn(),
	useDispatch: () => ( { __unstableMarkNextChangeAsNotPersistent: markNextChangeAsNotPersistent } ),
	useSelect: selector =>
		selector( () => ( {
			getIntegrations: () => integrations,
			isIntegrationsLoading: () => false,
		} ) ),
} ) );

const { default: useFormBlockDefaults } = await import(
	'../../../../../../src/blocks/contact-form/shared/hooks/use-form-block-defaults.js'
);

describe( 'useFormBlockDefaults', () => {
	beforeEach( () => {
		integrations = [
			{ id: 'zero-bs-crm', enabledByDefault: false },
			{ id: 'mailpoet', enabledByDefault: false },
			{ id: 'salesforce', enabledByDefault: false },
		];
		markNextChangeAsNotPersistent.mockReset();
	} );

	it( 'marks every editor-initialized integration default nonpersistent before setting it', () => {
		const setAttributes = jest.fn();
		renderHook( () =>
			useFormBlockDefaults( {
				attributes: { mailpoet: { listId: null }, salesforceData: { organizationId: '' } },
				setAttributes,
			} )
		);

		expect( setAttributes ).toHaveBeenCalledWith( { jetpackCRM: false } );
		expect( setAttributes ).toHaveBeenCalledWith( {
			mailpoet: { listId: null, enabledForForm: false },
		} );
		expect( setAttributes ).toHaveBeenCalledWith( {
			salesforceData: { organizationId: '', sendToSalesforce: false },
		} );
		expect( markNextChangeAsNotPersistent ).toHaveBeenCalledTimes( 3 );
		setAttributes.mock.invocationCallOrder.forEach( ( callOrder, index ) => {
			expect( markNextChangeAsNotPersistent.mock.invocationCallOrder[ index ] ).toBeLessThan(
				callOrder
			);
		} );
	} );
} );
