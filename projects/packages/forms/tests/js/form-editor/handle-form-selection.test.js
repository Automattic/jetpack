import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { handleFormSelection } from '../../../src/blocks/contact-form/util/handle-form-selection.js';

describe( 'handleFormSelection', () => {
	let setAttributes, selectBlock, batch;
	const clientId = 'test-client-id';

	beforeEach( () => {
		setAttributes = jest.fn();
		selectBlock = jest.fn();
		batch = fn => fn();
	} );

	it( 'sets ref attribute as integer and selects block', () => {
		handleFormSelection( { formId: '123', batch, setAttributes, selectBlock, clientId } );

		expect( setAttributes ).toHaveBeenCalledWith( { ref: 123 } );
		expect( selectBlock ).toHaveBeenCalledWith( clientId );
	} );

	it.each( [ '', null, undefined ] )( 'does nothing when formId is %p', formId => {
		handleFormSelection( { formId, batch, setAttributes, selectBlock, clientId } );

		expect( setAttributes ).not.toHaveBeenCalled();
		expect( selectBlock ).not.toHaveBeenCalled();
	} );
} );
