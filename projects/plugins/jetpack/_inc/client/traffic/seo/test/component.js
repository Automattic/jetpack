/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { stringToTokenizedArray, tokenizedArrayToString } from '../custom-seo-titles';

describe( 'Traffic - Custom SEO Titles', () => {
	const allTokens = '[site_name][tagline][post_title][page_title][group_title][date][archive_title]';
	const mockData = {
		front_page: {
			str: `front_page ${allTokens}`,
			arr: [
				{
					"type": "string",
					"value": "front_page "
				},
				{
					"type": "token",
					"value": "site_name"
				},
				{
					"type": "token",
					"value": "tagline"
				},
				{
					"type": "string",
					"value": "[post_title]"
				},
				{
					"type": "string",
					"value": "[page_title]"
				},
				{
					"type": "string",
					"value": "[group_title]"
				},
				{
					"type": "string",
					"value": "[date]"
				},
				{
					"type": "string",
					"value": "[archive_title]"
				},
			]
		},
		posts: {
			str: `posts ${allTokens}`,
			arr: [
				{
					"type": "string",
					"value": "posts "
				},
				{
					"type": "token",
					"value": "site_name"
				},
				{
					"type": "token",
					"value": "tagline"
				},
				{
					"type": "token",
					"value": "post_title"
				},
				{
					"type": "string",
					"value": "[page_title]"
				},
				{
					"type": "string",
					"value": "[group_title]"
				},
				{
					"type": "string",
					"value": "[date]"
				},
				{
					"type": "string",
					"value": "[archive_title]"
				},
			]
		},
		pages: {
			str: `pages ${allTokens}`,
			arr: [
				{
					"type": "string",
					"value": "pages "
				},
				{
					"type": "token",
					"value": "site_name"
				},
				{
					"type": "token",
					"value": "tagline"
				},
				{
					"type": "string",
					"value": "[post_title]"
				},
				{
					"type": "token",
					"value": "page_title"
				},
				{
					"type": "string",
					"value": "[group_title]"
				},
				{
					"type": "string",
					"value": "[date]"
				},
				{
					"type": "string",
					"value": "[archive_title]"
				},
			]
		},
		groups: {
			str: `groups ${allTokens}`,
			arr: [
				{
					"type": "string",
					"value": "groups "
				},
				{
					"type": "token",
					"value": "site_name"
				},
				{
					"type": "token",
					"value": "tagline"
				},
				{
					"type": "string",
					"value": "[post_title]"
				},
				{
					"type": "string",
					"value": "[page_title]"
				},
				{
					"type": "token",
					"value": "group_title"
				},
				{
					"type": "string",
					"value": "[date]"
				},
				{
					"type": "string",
					"value": "[archive_title]"
				},
			]
		},
		archives: {
			str: `archives ${allTokens}`,
			arr: [
				{
					"type": "string",
					"value": "archives "
				},
				{
					"type": "token",
					"value": "site_name"
				},
				{
					"type": "token",
					"value": "tagline"
				},
				{
					"type": "string",
					"value": "[post_title]"
				},
				{
					"type": "string",
					"value": "[page_title]"
				},
				{
					"type": "string",
					"value": "[group_title]"
				},
				{
					"type": "string",
					"value": "[date]"
				},
				{
					"type": "token",
					"value": "archive_title"
				}
			]
		}
	};

	describe( 'stringToTokenizedArray()', () => {
		it( 'given an empty string return an empty array', () => {
			expect( stringToTokenizedArray( '', '' ) ).to.be.an( 'array' ).that.has.lengthOf( 0 );
		} );

		it( 'tokenize correct tokens per page type', () => {
			expect( stringToTokenizedArray( mockData.front_page.str, 'front_page' ) )
				.to.deep.equal( mockData.front_page.arr );
			expect( stringToTokenizedArray( mockData.posts.str, 'posts' ) )
				.to.deep.equal( mockData.posts.arr );
			expect( stringToTokenizedArray( mockData.pages.str, 'pages' ) )
				.to.deep.equal( mockData.pages.arr );
			expect( stringToTokenizedArray( mockData.groups.str, 'groups' ) )
				.to.deep.equal( mockData.groups.arr );
			expect( stringToTokenizedArray( mockData.archives.str, 'archives' ) )
				.to.deep.equal( mockData.archives.arr );
			expect( stringToTokenizedArray( 'Test failure case', 'archives' ) )
				.to.not.deep.equal( mockData.archives.arr );
		} );
	} );

	describe( 'tokenizedArrayToString()', () => {
		it( 'given an empty array return an empty string', () => {
			expect( tokenizedArrayToString( [] ) ).to.equal( '' );
		} );

		it( 'assemble correct string for given token array', () => {
			expect( tokenizedArrayToString( mockData.front_page.arr ) ).to.equal( mockData.front_page.str );
			expect( tokenizedArrayToString( mockData.posts.arr ) ).to.equal( mockData.posts.str );
			expect( tokenizedArrayToString( mockData.pages.arr ) ).to.equal( mockData.pages.str );
			expect( tokenizedArrayToString( mockData.groups.arr ) ).to.equal( mockData.groups.str );
			expect( tokenizedArrayToString( mockData.archives.arr ) ).to.equal( mockData.archives.str );
			expect( tokenizedArrayToString( 'Test failure case' ) ).to.not.equal( mockData.archives.str );
		} );
	} );
} );
