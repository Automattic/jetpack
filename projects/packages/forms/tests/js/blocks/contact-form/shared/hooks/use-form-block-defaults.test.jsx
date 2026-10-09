import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';

const markNextChangeAsNotPersistent = jest.fn();
let integrations = [];
let isLoading = false;

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	createReduxStore: jest.fn(),
	register: jest.fn(),
	select: jest.fn(),
	useDispatch: () => ( { __unstableMarkNextChangeAsNotPersistent: markNextChangeAsNotPersistent } ),
	useSelect: selector =>
		selector( () => ( {
			getIntegrations: () => integrations,
			isIntegrationsLoading: () => isLoading,
		} ) ),
} ) );

const { default: useFormBlockDefaults } =
	await import( '../../../../../../src/blocks/contact-form/shared/hooks/use-form-block-defaults.js' );

describe( 'useFormBlockDefaults', () => {
	beforeEach( () => {
		integrations = [
			{ id: 'zero-bs-crm', enabledByDefault: false },
			{ id: 'mailpoet', enabledByDefault: false },
			{ id: 'salesforce', enabledByDefault: false },
		];
		markNextChangeAsNotPersistent.mockReset();
		isLoading = false;
	} );

	// Form markup that ships in a theme file or a pattern carries none of these
	// flags, which is what makes this hook run at all.
	const unconfigured = () => ( {
		mailpoet: { listId: null },
		salesforceData: { organizationId: '' },
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

	it( 'carries the enabledByDefault value through', () => {
		const setAttributes = jest.fn();
		integrations = [
			{ id: 'zero-bs-crm', enabledByDefault: true },
			{ id: 'mailpoet', enabledByDefault: true },
			{ id: 'salesforce', enabledByDefault: true },
		];

		renderHook( () => useFormBlockDefaults( { attributes: unconfigured(), setAttributes } ) );

		expect( setAttributes ).toHaveBeenCalledWith( { jetpackCRM: true } );
		expect( setAttributes ).toHaveBeenCalledWith( {
			mailpoet: { listId: null, enabledForForm: true },
		} );
		expect( setAttributes ).toHaveBeenCalledWith( {
			salesforceData: { organizationId: '', sendToSalesforce: true },
		} );
	} );

	it( 'writes nothing when every flag is already set', () => {
		const setAttributes = jest.fn();

		renderHook( () =>
			useFormBlockDefaults( {
				attributes: {
					jetpackCRM: true,
					mailpoet: { listId: null, enabledForForm: true },
					salesforceData: { organizationId: '', sendToSalesforce: false },
				},
				setAttributes,
			} )
		);

		expect( setAttributes ).not.toHaveBeenCalled();
		expect( markNextChangeAsNotPersistent ).not.toHaveBeenCalled();
	} );

	it( 'writes nothing while the integrations store is still loading', () => {
		const setAttributes = jest.fn();
		isLoading = true;

		renderHook( () => useFormBlockDefaults( { attributes: unconfigured(), setAttributes } ) );

		expect( setAttributes ).not.toHaveBeenCalled();
		expect( markNextChangeAsNotPersistent ).not.toHaveBeenCalled();
	} );

	it( 'skips integrations the site does not offer', () => {
		const setAttributes = jest.fn();
		integrations = [ { id: 'mailpoet', enabledByDefault: false } ];

		renderHook( () => useFormBlockDefaults( { attributes: unconfigured(), setAttributes } ) );

		expect( setAttributes ).toHaveBeenCalledTimes( 1 );
		expect( setAttributes ).toHaveBeenCalledWith( {
			mailpoet: { listId: null, enabledForForm: false },
		} );
	} );
} );
