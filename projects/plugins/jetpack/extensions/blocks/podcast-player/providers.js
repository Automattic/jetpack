/**
 * External dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import jetpackPodcastProvider from './providers/jetpack';
import pocketCastPodcastProvider from './providers/pocket-casts';

export const JETPACK_PODCAST_PROVIDER_NAME_SLUG = 'jetpack';
export const POCKET_CASTS_PODCAST_PROVIDER_NAME_SLUG = 'pocket-casts';

export const PODCAST_PROVIDERS = {
	[ JETPACK_PODCAST_PROVIDER_NAME_SLUG ]: jetpackPodcastProvider,
	[ POCKET_CASTS_PODCAST_PROVIDER_NAME_SLUG ]: pocketCastPodcastProvider,
};

export const PODCAST_PROVIDERS_NAME_SLUGS = Object.keys( PODCAST_PROVIDERS );

function normalizeNameSlug( providerNameSlug ) {
	// This ensures that incorrect or empty name slugs fallback to default provider.
	return PODCAST_PROVIDERS_NAME_SLUGS.indexOf( providerNameSlug ) > -1
		? providerNameSlug
		: JETPACK_PODCAST_PROVIDER_NAME_SLUG;
}

export function getPodcastProvider( providerNameSlug ) {
	return PODCAST_PROVIDERS[ normalizeNameSlug( providerNameSlug ) ];
}

export const withPodcastProvider = createHigherOrderComponent( WrappedComponent => {
	return props => {
		const {
			provider: { FooterToolbar },
		} = props;

		// Create footer toolbar component that receives the same props as the player component
		const footerToolbar = FooterToolbar ? <FooterToolbar { ...props }></FooterToolbar> : null;

		return <WrappedComponent { ...props } footerToolbar={ footerToolbar }></WrappedComponent>;
	};
}, 'withCustomClassName' );
