import { renderHook, act } from '@testing-library/react';
import { store as coreStore } from '@wordpress/core-data';
import { createRegistry, RegistryProvider, WPDataRegistry } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { usePostMeta } from '../use-post-meta';

const postId = 44;

const postTypeConfig = {
	kind: 'postType',
	name: 'post',
	baseURL: '/wp/v2/posts',
	transientEdits: { blocks: true, selection: true },
	mergedEdits: { meta: true },
	rawAttributes: [ 'title', 'excerpt', 'content' ],
};

const postTypeEntity = {
	slug: 'post',
	rest_base: 'posts',
	labels: {},
};

const post = {
	id: postId,
	type: 'post',
	title: 'bar',
	content: 'bar',
	excerpt: 'crackers',
	status: 'draft',
	meta: {
		jetpack_publicize_message: 'test',
		jetpack_publicize_feature_enabled: true,
		jetpack_social_post_already_shared: false,
		jetpack_social_options: {
			image_generator_settings: {
				template: 'highway',
				enabled: false,
			},
			attached_media: [
				{
					id: 26,
					url: 'http://wordpress.com/some-url-of-a-picture',
					type: 'image/jpeg',
				},
			],
		},
	},
};

/**
 * Create a registry with stores.
 *
 * @returns {WPDataRegistry} Registry.
 */
function createRegistryWithStores() {
	// Create a registry.
	const registry = createRegistry();

	// Register stores.
	registry.register( coreStore );
	registry.register( editorStore );

	// Register post type entity.
	registry.dispatch( coreStore ).addEntities( [ postTypeConfig ] );

	// Store post type entity.
	registry.dispatch( coreStore ).receiveEntityRecords( 'root', 'postType', [ postTypeEntity ] );

	// Store post.
	registry.dispatch( coreStore ).receiveEntityRecords( 'postType', 'post', post );

	// Setup editor with post.
	registry.dispatch( editorStore ).setupEditor( post );

	return registry;
}

describe( 'usePostMeta', () => {
	it( 'should return the default values', () => {
		const { result } = renderHook( () => usePostMeta(), {
			wrapper: ( { children } ) => (
				<RegistryProvider value={ createRegistryWithStores() }>{ children }</RegistryProvider>
			),
		} );

		expect( result.current.attachedMedia ).toEqual(
			post.meta.jetpack_social_options.attached_media
		);
		expect( result.current.imageGeneratorSettings ).toEqual(
			post.meta.jetpack_social_options.image_generator_settings
		);
		expect( result.current.isPostAlreadyShared ).toEqual(
			post.meta.jetpack_social_post_already_shared
		);
		expect( result.current.isPublicizeEnabled ).toEqual(
			post.meta.jetpack_publicize_feature_enabled
		);
		expect( result.current.jetpackSocialOptions ).toEqual( post.meta.jetpack_social_options );
		expect( result.current.shareMessage ).toEqual( post.meta.jetpack_publicize_message );
		// it should be false by default
		expect( result.current.shouldUploadAttachedMedia ).toBe( false );
	} );

	it( 'should return the updated values', () => {
		const registry = createRegistryWithStores();
		const { result } = renderHook( () => usePostMeta(), {
			wrapper: ( { children } ) => (
				<RegistryProvider value={ registry }>{ children }</RegistryProvider>
			),
		} );

		act( () => {
			// update the meta
			result.current.updateMeta( 'jetpack_publicize_feature_enabled', false );
			result.current.updateMeta( 'jetpack_publicize_message', 'updated message' );
			result.current.updateMeta( 'jetpack_social_post_already_shared', true );
			result.current.updateMeta( 'jetpack_social_options', {
				attached_media: [
					{
						id: 26,
						url: 'http://wordpress.com/some-url-of-a-picture',
						type: 'image/jpeg',
					},
					{
						id: 27,
						url: 'http://wordpress.com/some-url-of-a-picture',
						type: 'image/jpeg',
					},
				],
			} );
		} );

		// use separate act calls to ensure that the previous state is updated before the next one
		act( () => {
			// update the jetpack social options
			result.current.updateJetpackSocialOptions( 'image_generator_settings', {
				template: 'highway',
				enabled: true,
			} );
		} );

		act( () => {
			result.current.updateJetpackSocialOptions( 'should_upload_attached_media', true );
		} );

		expect( result.current.isPublicizeEnabled ).toBe( false );
		expect( result.current.shareMessage ).toBe( 'updated message' );
		expect( result.current.isPostAlreadyShared ).toBe( true );
		expect( result.current.jetpackSocialOptions ).toEqual( {
			attached_media: [
				{
					id: 26,
					url: 'http://wordpress.com/some-url-of-a-picture',
					type: 'image/jpeg',
				},
				{
					id: 27,
					url: 'http://wordpress.com/some-url-of-a-picture',
					type: 'image/jpeg',
				},
			],
			image_generator_settings: {
				template: 'highway',
				enabled: true,
			},
			should_upload_attached_media: true,
		} );
	} );
} );
