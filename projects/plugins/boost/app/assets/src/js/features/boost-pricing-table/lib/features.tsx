import { PricingTable, PricingTableItem, getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React, { ReactElement } from 'react';

type PricingTableItemProps = React.ComponentProps< typeof PricingTableItem >;
type PricingTableProps = React.ComponentProps< typeof PricingTable >;

const cssOptimizationContext = __(
	'Move important styling information to the start of the page, which helps pages display your content sooner, so your users don’t have to wait for the entire page to load. Commonly referred to as Critical CSS.',
	'jetpack-boost'
);

const manuallyUpdatedContext = (
	<span>
		{ __(
			'To enhance the speed of your site, with this plan you will need to optimize CSS by using the Manual Critical CSS generation feature whenever you:',
			'jetpack-boost'
		) }
		<br />
		<br />
		<ul>
			<li>{ __( 'Make theme changes.', 'jetpack-boost' ) }</li>
			<li>{ __( 'Write a new post/page.', 'jetpack-boost' ) }</li>
			<li>{ __( 'Edit a post/page.', 'jetpack-boost' ) }</li>
			<li>
				{ __(
					'Activate, deactivate, or update plugins that impact your site layout or HTML structure.',
					'jetpack-boost'
				) }
			</li>
			<li>
				{ __(
					'Change settings of plugins that impact your site layout or HTML structure.',
					'jetpack-boost'
				) }
			</li>
			<li>
				{ __(
					'Upgrade your WordPress version if the new release includes core CSS changes.',
					'jetpack-boost'
				) }
			</li>
		</ul>
	</span>
);

const automaticallyUpdatedContext = (
	<span>
		{ __(
			'It’s essential to regenerate Critical CSS to optimize your site speed whenever your HTML or CSS structure changes. Being on top of this can be tedious and time-consuming.',
			'jetpack-boost'
		) }
		<br />
		<br />
		{ __(
			'Boost’s cloud service can automatically detect when your site needs the Critical CSS regenerated, and perform this function behind the scenes without requiring you to monitor it manually.',
			'jetpack-boost'
		) }
	</span>
);

const pageCacheContext = __(
	'Page caching speeds up load times by storing a copy of each web page on the first visit, allowing subsequent visits to be served instantly. This reduces server load and improves user experience by delivering content faster, without waiting for the page to be generated again.',
	'jetpack-boost'
);

const imageCdnContext = __(
	`Deliver images from Jetpack's Content Delivery Network. Automatically resizes your images to an appropriate size, converts them to modern efficient formats like WebP, and serves them from a worldwide network of servers.`,
	'jetpack-boost'
);

const isaContext = __(
	"Scan your site for images that aren't properly sized for the device they're being viewed on.",
	'jetpack-boost'
);

const performanceHistoryContext = __(
	'Get access to your historical performance scores and see advanced Core Web Vitals data.',
	'jetpack-boost'
);

const deferJSContextTemplate = __(
	'Run non-essential JavaScript after the page has loaded so that styles and images can load more quickly. Read more on <link>web.dev</link>.',
	'jetpack-boost'
);

const deferJSContext = createInterpolateElement( deferJSContextTemplate, {
	// eslint-disable-next-line jsx-a11y/anchor-has-content
	link: <a href={ getRedirectUrl( 'jetpack-boost-defer-js' ) } target="_blank" rel="noreferrer" />,
} );

const imageGuideContext = __(
	'Discover and fix images with a suboptimal resolution, aspect ratio, or file size, improving user experience and page speed.',
	'jetpack-boost'
);

const supportContext = __(
	`Paid customers get dedicated email support from our world-class Happiness Engineers to help with any issue.<br><br>All other questions are handled by our team as quickly as we are able to go through the WordPress support forum.`,
	'jetpack-boost'
);

const concatenateContext = __(
	'Boost your website performance by merging and compressing JavaScript and CSS files, reducing site loading time and number of requests.',
	'jetpack-boost'
);

type FeatureItem = {
	description: PricingTableProps[ 'items' ][ number ];
	free: ReactElement< PricingTableItemProps >;
	premium: ReactElement< PricingTableItemProps >;
};

export const boostFeatureList: FeatureItem[] = [
	{
		description: {
			name: __( 'Auto CSS Optimization', 'jetpack-boost' ),
			tooltipInfo: cssOptimizationContext,
			tooltipPlacement: 'bottom-start',
		},
		free: (
			<PricingTableItem
				isIncluded={ false }
				label={ __( 'Manual', 'jetpack-boost' ) }
				tooltipTitle={ __( 'Manual Critical CSS regeneration', 'jetpack-boost' ) }
				tooltipInfo={ manuallyUpdatedContext }
				tooltipClassName="wide-tooltip"
			/>
		),
		premium: (
			<PricingTableItem
				isIncluded={ true }
				label={ <strong>{ __( 'Included', 'jetpack-boost' ) }</strong> }
				tooltipTitle={ __( 'Automatic Critical CSS regeneration', 'jetpack-boost' ) }
				tooltipInfo={ automaticallyUpdatedContext }
				tooltipClassName="wide-tooltip"
			/>
		),
	},
	{
		description: {
			name: __( 'Automatic image size analysis', 'jetpack-boost' ),
			tooltipInfo: isaContext,
			tooltipPlacement: 'bottom-start',
		},
		free: <PricingTableItem isIncluded={ false } label={ __( 'Not included', 'jetpack-boost' ) } />,
		premium: <PricingTableItem isIncluded={ true } />,
	},
	{
		description: {
			name: __( 'Historical performance scores', 'jetpack-boost' ),
			tooltipInfo: performanceHistoryContext,
			tooltipPlacement: 'bottom-start',
		},
		free: <PricingTableItem isIncluded={ false } label={ __( 'Not included', 'jetpack-boost' ) } />,
		premium: <PricingTableItem isIncluded={ true } />,
	},
	{
		description: {
			name: __( 'Dedicated email support', 'jetpack-boost' ),
			tooltipInfo: <span dangerouslySetInnerHTML={ { __html: supportContext } }></span>,
			tooltipPlacement: 'bottom-start',
		},
		free: <PricingTableItem isIncluded={ false } label={ __( 'Not included', 'jetpack-boost' ) } />,
		premium: <PricingTableItem isIncluded={ true } />,
	},
	{
		description: {
			name: __( 'Page Cache', 'jetpack-boost' ),
			tooltipInfo: pageCacheContext,
			tooltipPlacement: 'bottom-start',
		},
		free: <PricingTableItem isIncluded={ true } />,
		premium: <PricingTableItem isIncluded={ true } />,
	},
	{
		description: {
			name: __( 'Image CDN Quality Settings', 'jetpack-boost' ),
			tooltipInfo: __( 'Fine-tune image quality settings to your liking.', 'jetpack-boost' ),
			tooltipPlacement: 'bottom-start',
		},
		free: <PricingTableItem isIncluded={ false } />,
		premium: <PricingTableItem isIncluded={ true } label={ __( 'Included', 'jetpack-boost' ) } />,
	},
	{
		description: {
			name: __( 'Image CDN Auto-Resize Lazy Images', 'jetpack-boost' ),
			tooltipInfo: __(
				'Optimizes lazy-loaded images by dynamically serving perfectly sized images for each device.',
				'jetpack-boost'
			),
			tooltipPlacement: 'bottom-start',
		},
		free: <PricingTableItem isIncluded={ false } />,
		premium: <PricingTableItem isIncluded={ true } label={ __( 'Included', 'jetpack-boost' ) } />,
	},
	{
		description: {
			name: __( 'Image CDN', 'jetpack-boost' ),
			tooltipInfo: imageCdnContext,
			tooltipPlacement: 'bottom-start',
		},
		free: <PricingTableItem isIncluded={ true } />,
		premium: <PricingTableItem isIncluded={ true } />,
	},
	{
		description: {
			name: __( 'Image guide', 'jetpack-boost' ),
			tooltipInfo: imageGuideContext,
			tooltipPlacement: 'bottom-start',
		},
		free: <PricingTableItem isIncluded={ true } />,
		premium: <PricingTableItem isIncluded={ true } />,
	},
	{
		description: {
			name: __( 'Defer non-essential JavaScript', 'jetpack-boost' ),
			tooltipInfo: deferJSContext,
			tooltipPlacement: 'bottom-start',
		},
		free: <PricingTableItem isIncluded={ true } />,
		premium: <PricingTableItem isIncluded={ true } />,
	},
	{
		description: {
			name: __( 'Concatenate JS and CSS', 'jetpack-boost' ),
			tooltipInfo: concatenateContext,
			tooltipPlacement: 'bottom-start',
		},
		free: <PricingTableItem isIncluded={ true } />,
		premium: <PricingTableItem isIncluded={ true } />,
	},
];
