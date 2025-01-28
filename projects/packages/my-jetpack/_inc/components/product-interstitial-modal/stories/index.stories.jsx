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
	description: 'Boost your site with Jetpack Boost',
	children: (
		<>
			<ProductInterstitialFeatureList features={ [ 'Feature 1', 'Feature 2', 'Feature 3' ] } />
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
	buttonContent: 'Upgrade now',
	secondaryColumn: <img src={ boostImage } alt="Boost" />,
	secondaryButtonHref: 'https://jetpack.com',
	secondaryButtonExternalLink: true,
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
