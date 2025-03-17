import { ProductPrice, JetpackLogo } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { HashRouter, Routes, Route } from 'react-router-dom';
import ProductInterstitialFeatureList from '../product-interstifial-feature-list';
import ProductInterstitialModal from '../product-interstitial-modal';
import boostImage from './boost.png';

export default {
	title: 'Packages/My Jetpack/Product Interstitial Modal',
	component: ProductInterstitialModal,
};

const DefaultArgs = {
	title: 'Jetpack Boost',
	description: 'Automatically regenerate critical CSS and hunt down image issues with ease.',
	children: (
		<>
			<ProductInterstitialFeatureList
				features={ [
					'Automated critical CSS',
					'Image size analyzer',
					'Performance history',
					'Image quality control',
					'Concatenate JS and CSS',
					'Image CDN',
					'Image guide',
				] }
			/>
		</>
	),
	priceComponent: (
		<ProductPrice
			currency="USD"
			price={ 24.92 }
			offPrice={ 12.42 }
			showNotOffPrice={ true }
			isNotConvenientPrice={ false }
			hidePriceFraction={ false }
			hideDiscountLabel={ false }
			promoLabel="NEW"
			legend="/month, paid yearly"
		/>
	),
	modalTriggerButtonLabel: 'Open Modal',
	buttonLabel: 'Upgrade now',
	isWithVideo: false,
	secondaryColumn: <img src={ boostImage } alt="Boost" />,
	secondaryButtonHref: 'https://jetpack.com',
	secondaryButtonHasExternalLink: true,
};

const Template = args => (
	<HashRouter>
		<Routes>
			<Route path="/" element={ <ProductInterstitialModal { ...args } /> } />
		</Routes>
	</HashRouter>
);

export const Default = Template.bind( {} );

export const WithAdditionalColumn = Template.bind( {} );
WithAdditionalColumn.args = {
	...DefaultArgs,
	secondaryColumn: <div>CTA Content</div>,
	additionalColumn: <div>Additional Column</div>,
};

export const WithVideo = Template.bind( {} );
WithVideo.args = {
	...DefaultArgs,
	isWithVideo: true,
	secondaryColumn: (
		<>
			<iframe
				width="621"
				height="447"
				src="https://video.wordpress.com/embed/whyeZF1t?cover=1&autoPlay=0&controls=0&loop=1&muted=0&persistVolume=1&playsinline=0&preloadContent=metadata&useAverageColor=1&posterUrl=https%3A%2F%2Fjetpack.com%2Fwp-content%2Fuploads%2F2024%2F09%2Fthumbnail-1.png&hd=1"
				allowFullScreen
				allow="clipboard-write"
				title={ __( 'Discover Jetpack AI', 'jetpack-my-jetpack' ) }
			></iframe>
			<script src="https://videopress.com/videopress-iframe.js"></script>
		</>
	),
};

export const WithCustomTrigger = Template.bind( {} );
WithCustomTrigger.args = {
	...DefaultArgs,
	modalTriggerButtonLabel: undefined,
	customModalTrigger: <JetpackLogo style={ { cursor: 'pointer' } } />,
};

Default.parameters = {};
Default.args = DefaultArgs;
