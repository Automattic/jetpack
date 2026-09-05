import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';

const INTEGRATIONS_STORE = 'jetpack/forms-integrations';

let integrations = [];
let isLoading = false;

const markNextChangeAsNotPersistent = jest.fn();

await jest.unstable_mockModule( '@wordpress/block-editor', () => ( {
	store: 'core/block-editor',
} ) );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	useDispatch: () => ( {
		__unstableMarkNextChangeAsNotPersistent: markNextChangeAsNotPersistent,
	} ),
	useSelect: mapSelect =>
		mapSelect( () => ( {
			getIntegrations: () => integrations,
			isIntegrationsLoading: () => isLoading,
		} ) ),
} ) );

await jest.unstable_mockModule( '../../../../../store/integrations/index.ts', () => ( {
	INTEGRATIONS_STORE,
} ) );

const { default: useFormBlockDefaults } = await import( '../use-form-block-defaults.js' );

const allIntegrations = ( { crm = false, mailpoet = false, salesforce = false } = {} ) => [
	{ id: 'zero-bs-crm', enabledByDefault: crm },
	{ id: 'mailpoet', enabledByDefault: mailpoet },
	{ id: 'salesforce', enabledByDefault: salesforce },
];

// The attribute shape a form carries when it comes from theme markup, a pattern,
// or any post saved before the integration flags existed: the object attributes
// have their schema defaults, and none of the three flags are present.
const unconfiguredAttributes = () => ( {
	mailpoet: { listId: null, listName: null },
	salesforceData: { organizationId: '' },
} );

describe( 'useFormBlockDefaults', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		integrations = allIntegrations();
		isLoading = false;
	} );

	it( 'seeds every missing flag in a single setAttributes call', () => {
		const setAttributes = jest.fn();

		renderHook( () =>
			useFormBlockDefaults( { attributes: unconfiguredAttributes(), setAttributes } )
		);

		expect( setAttributes ).toHaveBeenCalledTimes( 1 );
		expect( setAttributes ).toHaveBeenCalledWith( {
			jetpackCRM: false,
			mailpoet: { listId: null, listName: null, enabledForForm: false },
			salesforceData: { organizationId: '', sendToSalesforce: false },
		} );
	} );

	it( 'marks the seeding as not persistent so the entity stays clean', () => {
		const setAttributes = jest.fn();

		renderHook( () =>
			useFormBlockDefaults( { attributes: unconfiguredAttributes(), setAttributes } )
		);

		// A single non-persistent mark has to precede the single update, otherwise
		// the write lands as a content edit and the post, template, or template
		// part holding the form opens with unsaved changes nobody made.
		expect( markNextChangeAsNotPersistent ).toHaveBeenCalledTimes( 1 );
		expect( markNextChangeAsNotPersistent.mock.invocationCallOrder[ 0 ] ).toBeLessThan(
			setAttributes.mock.invocationCallOrder[ 0 ]
		);
	} );

	it( 'carries the enabledByDefault value through', () => {
		const setAttributes = jest.fn();
		integrations = allIntegrations( { crm: true, mailpoet: true, salesforce: true } );

		renderHook( () =>
			useFormBlockDefaults( { attributes: unconfiguredAttributes(), setAttributes } )
		);

		expect( setAttributes ).toHaveBeenCalledWith( {
			jetpackCRM: true,
			mailpoet: { listId: null, listName: null, enabledForForm: true },
			salesforceData: { organizationId: '', sendToSalesforce: true },
		} );
	} );

	it( 'writes nothing when every flag is already set', () => {
		const setAttributes = jest.fn();

		renderHook( () =>
			useFormBlockDefaults( {
				attributes: {
					jetpackCRM: true,
					mailpoet: { listId: null, listName: null, enabledForForm: true },
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

		renderHook( () =>
			useFormBlockDefaults( { attributes: unconfiguredAttributes(), setAttributes } )
		);

		expect( setAttributes ).not.toHaveBeenCalled();
		expect( markNextChangeAsNotPersistent ).not.toHaveBeenCalled();
	} );

	it( 'skips integrations the site does not offer', () => {
		const setAttributes = jest.fn();
		integrations = [ { id: 'mailpoet', enabledByDefault: false } ];

		renderHook( () =>
			useFormBlockDefaults( { attributes: unconfiguredAttributes(), setAttributes } )
		);

		expect( setAttributes ).toHaveBeenCalledWith( {
			mailpoet: { listId: null, listName: null, enabledForForm: false },
		} );
	} );
} );
