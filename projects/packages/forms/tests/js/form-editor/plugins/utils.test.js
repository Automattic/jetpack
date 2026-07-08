import { beforeEach, describe, expect, it } from '@jest/globals';
import { getResponsesUrl } from '../../../../src/form-editor/plugins/utils';

describe( 'getResponsesUrl', () => {
	beforeEach( () => {
		// Reset window.jpFormsBlocks before each test
		delete window.jpFormsBlocks;
	} );

	it( 'should use the default base URL when jpFormsBlocks is not defined', () => {
		const url = getResponsesUrl( 123 );

		expect( url ).toBe(
			'/wp-admin/admin.php?page=jetpack-forms-responses-wp-admin&p=%2Fresponses%2Finbox%3FsourceId%3D123'
		);
	} );

	it( 'should use the custom base URL from jpFormsBlocks when defined', () => {
		window.jpFormsBlocks = {
			defaults: {
				formsResponsesUrl: '/custom-admin/forms',
			},
		};

		const url = getResponsesUrl( 456 );

		expect( url ).toBe( '/custom-admin/forms?p=%2Fresponses%2Finbox%3FsourceId%3D456' );
	} );

	it( 'should use the default URL when formsResponsesUrl is empty', () => {
		window.jpFormsBlocks = {
			defaults: {
				formsResponsesUrl: '',
			},
		};

		const url = getResponsesUrl( 789 );

		expect( url ).toBe(
			'/wp-admin/admin.php?page=jetpack-forms-responses-wp-admin&p=%2Fresponses%2Finbox%3FsourceId%3D789'
		);
	} );

	it( 'should correctly encode the sourceId in the query parameter', () => {
		const url = getResponsesUrl( 999 );

		expect( url ).toContain( 'sourceId%3D999' );
	} );
} );
