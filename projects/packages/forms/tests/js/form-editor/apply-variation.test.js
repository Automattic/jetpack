import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { applyVariationToFormBlock } from '../../../src/blocks/contact-form/util/apply-variation.js';

describe( 'applyVariationToFormBlock', () => {
	const clientId = 'test-client-id';

	let setAttributes;
	let replaceInnerBlocks;
	let selectBlock;
	let batch;

	beforeEach( () => {
		setAttributes = jest.fn();
		replaceInnerBlocks = jest.fn();
		selectBlock = jest.fn();
		batch = fn => fn();
	} );

	it( 'applies attributes and inner blocks, then selects the block', () => {
		const createdBlocks = [ { name: 'core/paragraph', attributes: { content: 'Hi' } } ];
		const createBlocksFromTemplate = jest.fn( () => createdBlocks );
		const variation = {
			attributes: { foo: 'bar' },
			innerBlocks: [ [ 'core/paragraph', { content: 'Hi' } ] ],
		};

		applyVariationToFormBlock( {
			batch,
			setAttributes,
			replaceInnerBlocks,
			selectBlock,
			clientId,
			variation,
			createBlocksFromTemplate,
		} );

		expect( setAttributes ).toHaveBeenCalledWith( { foo: 'bar' } );
		expect( createBlocksFromTemplate ).toHaveBeenCalledWith( variation.innerBlocks );
		expect( replaceInnerBlocks ).toHaveBeenCalledWith( clientId, createdBlocks );
		expect( selectBlock ).toHaveBeenCalledWith( clientId );
	} );

	it( 'skips attributes when not provided', () => {
		const variation = { innerBlocks: [] };
		const createBlocksFromTemplate = jest.fn( () => [] );

		applyVariationToFormBlock( {
			batch,
			setAttributes,
			replaceInnerBlocks,
			selectBlock,
			clientId,
			variation,
			createBlocksFromTemplate,
		} );

		expect( setAttributes ).not.toHaveBeenCalled();
		expect( replaceInnerBlocks ).toHaveBeenCalled();
		expect( selectBlock ).toHaveBeenCalledWith( clientId );
	} );

	it( 'skips innerBlocks when not provided', () => {
		const variation = { attributes: { a: 1 } };
		const createBlocksFromTemplate = jest.fn();

		applyVariationToFormBlock( {
			batch,
			setAttributes,
			replaceInnerBlocks,
			selectBlock,
			clientId,
			variation,
			createBlocksFromTemplate,
		} );

		expect( setAttributes ).toHaveBeenCalledWith( { a: 1 } );
		expect( replaceInnerBlocks ).not.toHaveBeenCalled();
		expect( selectBlock ).toHaveBeenCalledWith( clientId );
	} );
} );
