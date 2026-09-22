/* eslint-disable jest-dom/prefer-in-document -- This Jest project does not load jest-dom. */
import { render, screen } from '@testing-library/react';
import CloudCssModule from '$features/critical-css/cloud-css-module/cloud-css-module';
import ImageCdn from '$features/image-cdn/image-cdn';
import ImageGuide from '$features/image-guide/image-guide';
import Lcp from '$features/lcp/lcp';
import MinifyCss from '$features/minify-css/minify-css';
import MinifyJs from '$features/minify-js/minify-js';
import { ModuleSurfaceProvider } from '$features/module/surface';
import PageCache from '$features/page-cache/page-cache';
import RenderBlockingJs from '$features/render-blocking-js/render-blocking-js';
import type { ReactNode } from 'react';

jest.mock( '$features/module/module', () => ( {
	__esModule: true,
	default: ( { title, description }: { title: string; description: ReactNode } ) => (
		<section>
			<h2>{ title }</h2>
			{ description }
		</section>
	),
} ) );
jest.mock( '$features/module/lib/stores', () => ( {
	useSingleModuleState: () => [ { available: true, active: false } ],
} ) );
jest.mock( '$lib/stores/minify', () => ( { useShowMinifyLegacy: () => ( {} ) } ) );
jest.mock( '$features/critical-css/lib/stores/critical-css-state', () => ( {
	useRegenerateCriticalCssAction: () => ( {} ),
} ) );
jest.mock( '$features/lcp/lib/stores/lcp-state', () => ( {
	useLcpState: () => [ { data: {} } ],
	useOptimizeLcpAction: () => ( {} ),
} ) );
jest.mock( '$lib/stores/page-cache', () => ( {
	usePageCacheSetup: () => [ {} ],
	usePageCacheError: () => [ {}, {} ],
} ) );
jest.mock( '$features/page-cache/lib/stores', () => ( {
	useShowCacheEngineErrorNotice: () => false,
} ) );
jest.mock( '$features/ui', () => ( { useMutationNotice: () => [ jest.fn() ] } ) );
jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );
jest.mock( '$features/critical-css/cloud-css-meta/cloud-css-meta', () => () => null );
jest.mock( '$features/render-blocking-js/render-blocking-js-meta', () => () => null );
jest.mock( '$features/minify-meta/minify-meta', () => () => null );
jest.mock( '$features/minify-legacy-notice/minify-legacy-notice', () => () => null );
jest.mock( '$features/page-cache/meta/meta', () => () => null );
jest.mock( '$features/page-cache/health/health', () => () => null );
jest.mock( '$features/image-cdn/image-cdn-liar/image-cdn-liar', () => () => null );
jest.mock( '$features/image-cdn/quality-settings/quality-settings', () => () => null );
jest.mock( '$features/upgrade-cta/interstitial-modal-cta', () => () => null );

beforeEach( () => {
	Object.assign( globalThis, {
		Jetpack_Boost: { canResizeImages: true, site: { host: 'other', hasCache: false } },
	} );
} );

test.each( [
	{
		component: CloudCssModule,
		extraModern: [
			'Boost will automatically generate your Critical CSS whenever you make changes.',
		],
		modernTitle: 'Optimize Critical CSS Loading (Automatic)',
		legacyTitle: 'Automatically Optimize CSS Loading',
		modern:
			/Prioritizes the styles needed to display the visible part of your page first\. Also known as/,
		legacy: /Move important styling information to the start of the page/,
	},
	{
		component: PageCache,
		modernTitle: 'Cache Site Pages',
		legacyTitle: 'Cache Site Pages',
		modern: 'Stores prepared versions of your pages so they can be served more efficiently.',
		legacy:
			'Store and serve preloaded content to reduce load times and enhance your site performance and user experience.',
	},
	{
		component: RenderBlockingJs,
		modernTitle: 'Defer Non-Essential JavaScript',
		legacyTitle: 'Defer Non-Essential JavaScript',
		modern: /Delays non-essential JavaScript until the main page content has loaded/,
		legacy:
			/Run non-essential JavaScript after the page has loaded so that styles and images can load more quickly/,
	},
	{
		component: MinifyJs,
		modernTitle: 'Concatenate JavaScript',
		legacyTitle: 'Concatenate JS',
		modern:
			'Combines and minifies JavaScript files to reduce the number of scripts your site needs to load.',
		legacy:
			'Scripts are grouped by their original placement, concatenated and minified to reduce site loading time and reduce the number of requests.',
	},
	{
		component: MinifyCss,
		modernTitle: 'Concatenate CSS',
		legacyTitle: 'Concatenate CSS',
		modern:
			'Combines and minifies stylesheet files to reduce the number of styles your site needs to load.',
		legacy:
			'Styles are grouped by their original placement, concatenated and minified to reduce site loading time and reduce the number of requests.',
	},
	{
		component: Lcp,
		modernTitle: 'Optimize LCP Images',
		legacyTitle: 'Optimize LCP Images',
		modern:
			'Optimizes the main visible image used to calculate your Cornerstone Pages’ LCP scores.',
		legacy:
			'Improve the Largest Contentful Paint (LCP) of your Cornerstone Pages, optimizing their key image, so users can enjoy a smoother experience.',
	},
	{
		component: ImageCdn,
		modernTitle: 'Image CDN',
		legacyTitle: 'Image CDN',
		modern:
			"Optimizes and delivers images through Jetpack's global network, with control over image quality.",
		legacy:
			"Deliver images from Jetpack's Content Delivery Network. Automatically resizes your images to an appropriate size, converts them to modern efficient formats like WebP, and serves them from a worldwide network of servers.",
	},
	{
		component: ImageGuide,
		modernTitle: 'Enable image guide',
		legacyTitle: 'Image Guide',
		modern:
			'Shows image size information as you browse, helping you spot images that may be too large.',
		legacy:
			"This feature helps you discover images that are too large. When you browse your site, the image guide will show you an overlay with information about each image's size.",
	},
] )(
	'$modernTitle uses modern copy while preserving legacy copy',
	( { component: Component, modernTitle, legacyTitle, modern, legacy, extraModern = [] } ) => {
		const view = render(
			<ModuleSurfaceProvider value="row">
				<Component />
			</ModuleSurfaceProvider>
		);
		expect( screen.getByRole( 'heading', { name: modernTitle } ) ).toBeTruthy();
		expect( screen.getByText( modern ) ).toBeTruthy();
		expect( screen.queryByText( legacy ) ).toBeNull();
		extraModern.forEach( text => expect( screen.getByText( text ) ).toBeTruthy() );
		view.rerender(
			<ModuleSurfaceProvider value="block">
				<Component />
			</ModuleSurfaceProvider>
		);
		expect( screen.getByRole( 'heading', { name: legacyTitle } ) ).toBeTruthy();
		expect( screen.getByText( legacy ) ).toBeTruthy();
		expect( screen.queryByText( modern ) ).toBeNull();
	}
);
