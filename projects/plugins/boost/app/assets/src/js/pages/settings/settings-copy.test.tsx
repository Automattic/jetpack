/* eslint-disable jest-dom/prefer-in-document -- This Jest project does not load jest-dom. */
import { render, screen } from '@testing-library/react';
import CloudCssModule from '$features/critical-css/cloud-css-module/cloud-css-module';
import ImageCdn from '$features/image-cdn/image-cdn';
import ImageGuide from '$features/image-guide/image-guide';
import Lcp from '$features/lcp/lcp';
import MinifyCss from '$features/minify-css/minify-css';
import MinifyJs from '$features/minify-js/minify-js';
import PageCache from '$features/page-cache/page-cache';
import RenderBlockingJs from '$features/render-blocking-js/render-blocking-js';
import { ModuleSurfaceProvider } from '$features/module/surface';
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

beforeEach( () => {
	Object.assign( globalThis, {
		Jetpack_Boost: { canResizeImages: true, site: { host: 'other', hasCache: false } },
	} );
} );

test.each( [
	{
		component: CloudCssModule,
		title: 'Optimize Critical CSS Loading (Automatic)',
		description:
			/Prioritizes the styles needed to display the visible part of your page first\. Also known as/,
	},
	{
		component: PageCache,
		title: 'Cache Site Pages',
		description: 'Stores prepared versions of your pages so they can be served more efficiently.',
	},
	{
		component: RenderBlockingJs,
		title: 'Defer Non-Essential JavaScript',
		description: /Delays non-essential JavaScript until the main page content has loaded/,
	},
	{
		component: MinifyJs,
		title: 'Concatenate JavaScript',
		description:
			'Combines and minifies JavaScript files to reduce the number of scripts your site needs to load.',
	},
	{
		component: MinifyCss,
		title: 'Concatenate CSS',
		description:
			'Combines and minifies stylesheet files to reduce the number of styles your site needs to load.',
	},
	{
		component: Lcp,
		title: 'Optimize LCP Images',
		description:
			'Optimizes the main visible image used to calculate your Cornerstone Pages’ LCP scores.',
	},
	{
		component: ImageCdn,
		title: 'Image CDN',
		description:
			"Optimizes and delivers images through Jetpack's global network, with control over image quality.",
	},
	{
		component: ImageGuide,
		title: 'Enable image guide',
		description:
			'Shows image size information as you browse, helping you spot images that may be too large.',
	},
] )( '$title shows its title and description', ( { component: Component, title, description } ) => {
	render(
		<ModuleSurfaceProvider value="row">
			<Component />
		</ModuleSurfaceProvider>
	);
	expect( screen.getByRole( 'heading', { name: title } ) ).toBeTruthy();
	expect( screen.getByText( description ) ).toBeTruthy();
} );
