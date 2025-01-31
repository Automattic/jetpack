import { ProductPrice } from '@automattic/jetpack-components';
import React from 'react';
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
		</>
	),
	triggerButton: 'Open Modal',
	buttonLabel: 'Upgrade now',
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

Default.parameters = {};
Default.args = DefaultArgs;
