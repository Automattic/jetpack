import { Button, ProductPrice } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { HashRouter, Routes, Route } from 'react-router';
import ProductInterstitialV2 from '..';
import Logo from '../../../../../../js-packages/publicize-components/src/components/admin-page/page-header/logo';

export default {
	title: 'Packages/My Jetpack/Product Interstitial V2',
	component: ProductInterstitialV2,
};

const socialFeatures = [
	{ name: __( 'Priority support', 'jetpack-my-jetpack' ) },
	{ name: __( 'Schedule posting', 'jetpack-my-jetpack' ) },
	{
		name: __(
			'Share to Facebook, Instagram, LinkedIn, Mastodon, Tumblr, Threads, Bluesky, and Nextdoor',
			'jetpack-my-jetpack'
		),
	},
	{ name: __( 'Customize publications', 'jetpack-my-jetpack' ) },
	{
		name: __( 'Recycle content', 'jetpack-my-jetpack' ),
		tooltipInfo: __(
			'Repurpose, reuse or republish already published content.',
			'jetpack-my-jetpack'
		),
	},
	{
		name: __( 'Upload custom images with your posts', 'jetpack-my-jetpack' ),
	},
	{
		name: __( 'Upload videos with your posts', 'jetpack-my-jetpack' ),
	},
	{
		name: __( 'Automatically generate images for posts', 'jetpack-my-jetpack' ),
		tooltipInfo: __(
			'Automatically create custom images, saving you hours of tedious work.',
			'jetpack-my-jetpack'
		),
	},
	{
		name: __( 'Multi-image sharing', 'jetpack-my-jetpack' ),
		tooltipTitle: __( 'Coming soon', 'jetpack-my-jetpack' ),
		tooltipInfo: __(
			'Share multiple images at once on social media platforms.',
			'jetpack-my-jetpack'
		),
	},
];

const DefaultArgs = {
	title: __( 'Write once, post everywhere', 'jetpack-my-jetpack' ),
	headerLogo: <Logo height={ 32 } />,
	items: socialFeatures,
	columns: [
		{
			header: (
				<>
					<ProductPrice
						price={ 24.95 }
						offPrice={ 12.48 }
						legend={ __(
							'per month for the first year, then billed yearly',
							'jetpack-my-jetpack'
						) }
						currency="USD"
						hidePriceFraction
					/>
					<Button fullWidth>{ __( 'Get Social', 'jetpack-my-jetpack' ) }</Button>
				</>
			),
			primary: true,
			items: [
				true,
				true,
				true,
				true,
				true,
				true,
				true,
				true,
				{ isIncluded: false, isComingSoon: true },
			],
		},
		{
			header: (
				<>
					<ProductPrice price={ 0 } legend="" currency="USD" hidePriceFraction />
					<Button fullWidth variant="secondary">
						{ __( 'Start for free', 'jetpack-my-jetpack' ) }
					</Button>
				</>
			),
			items: [ false, true, true, true, true, false, false, false, false ],
		},
	],
	showIntroOfferDisclaimer: true,
};

const Template = args => (
	<HashRouter>
		<Routes>
			<Route path="/" element={ <ProductInterstitialV2 { ...args } /> } />
		</Routes>
	</HashRouter>
);

export const Default = Template.bind( {} );
Default.args = DefaultArgs;

export const WithoutDisclaimer = Template.bind( {} );
WithoutDisclaimer.args = {
	...DefaultArgs,
	showIntroOfferDisclaimer: false,
};

export const WithLogo = Template.bind( {} );
WithLogo.args = {
	...DefaultArgs,
	headerLogo: <Logo height={ 40 } />,
};

export const MultipleColumns = Template.bind( {} );
MultipleColumns.args = {
	title: __( 'Choose your plan', 'jetpack-my-jetpack' ),
	items: [
		{ name: __( 'Basic feature', 'jetpack-my-jetpack' ) },
		{ name: __( 'Advanced feature', 'jetpack-my-jetpack' ) },
		{ name: __( 'Premium feature', 'jetpack-my-jetpack' ) },
		{ name: __( 'Enterprise feature', 'jetpack-my-jetpack' ) },
	],
	columns: [
		{
			header: (
				<>
					<ProductPrice price={ 0 } currency="USD" hidePriceFraction />
					<Button fullWidth variant="secondary">
						{ __( 'Free', 'jetpack-my-jetpack' ) }
					</Button>
				</>
			),
			items: [ true, false, false, false ],
		},
		{
			header: (
				<>
					<ProductPrice price={ 9.95 } currency="USD" hidePriceFraction legend="/month" />
					<Button fullWidth variant="secondary">
						{ __( 'Basic', 'jetpack-my-jetpack' ) }
					</Button>
				</>
			),
			items: [ true, true, false, false ],
		},
		{
			header: (
				<>
					<ProductPrice price={ 19.95 } currency="USD" hidePriceFraction legend="/month" />
					<Button fullWidth>{ __( 'Pro', 'jetpack-my-jetpack' ) }</Button>
				</>
			),
			primary: true,
			items: [ true, true, true, false ],
		},
		{
			header: (
				<>
					<ProductPrice price={ 39.95 } currency="USD" hidePriceFraction legend="/month" />
					<Button fullWidth variant="secondary">
						{ __( 'Enterprise', 'jetpack-my-jetpack' ) }
					</Button>
				</>
			),
			items: [ true, true, true, true ],
		},
	],
	showIntroOfferDisclaimer: false,
};

export const WithCustomLabels = Template.bind( {} );
WithCustomLabels.args = {
	title: __( 'Feature comparison', 'jetpack-my-jetpack' ),
	items: [
		{ name: __( 'Custom feature', 'jetpack-my-jetpack' ) },
		{ name: __( 'Special feature', 'jetpack-my-jetpack' ) },
		{ name: __( 'Limited feature', 'jetpack-my-jetpack' ) },
	],
	columns: [
		{
			header: (
				<>
					<ProductPrice price={ 0 } currency="USD" hidePriceFraction />
					<Button fullWidth variant="secondary">
						{ __( 'Free', 'jetpack-my-jetpack' ) }
					</Button>
				</>
			),
			items: [
				{ isIncluded: true, label: __( 'Basic version', 'jetpack-my-jetpack' ) },
				{ isIncluded: false },
				{ isIncluded: true, label: '5 per month' },
			],
		},
		{
			header: (
				<>
					<ProductPrice price={ 15.95 } currency="USD" hidePriceFraction legend="/month" />
					<Button fullWidth>{ __( 'Pro', 'jetpack-my-jetpack' ) }</Button>
				</>
			),
			primary: true,
			items: [
				{ isIncluded: true, label: __( 'Full version', 'jetpack-my-jetpack' ) },
				{ isIncluded: true },
				{ isIncluded: true, label: __( 'Unlimited', 'jetpack-my-jetpack' ) },
			],
		},
	],
	showIntroOfferDisclaimer: false,
};
