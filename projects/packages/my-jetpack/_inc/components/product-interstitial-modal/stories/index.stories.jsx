import { Text, ProductPrice } from '@automattic/jetpack-components';
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import ProductInterstitialModal from '..';
import boostImage from './boost.png';

export default {
	title: 'Packages/My Jetpack/Product Interstitial Modal',
	component: ProductInterstitialModal,
};

const DefaultArgs = {
	title: 'Product Interstitial Modal',
	children: (
		<div style={ { display: 'flex', flexDirection: 'column', gap: '1rem' } }>
			<Text>
				Lorem ipsum dolor <b>sit amet</b>, consectetur adipiscing elit. Cras rutrum neque odio, vel
				viverra lectus vulputate et. Lorem ipsum dolor <b>sit amet</b>, consectetur adipiscing elit.
				Cras rutrum neque odio, vel viverra lectus vulputate et. Lorem ipsum dolor <b>sit amet</b>,
				consectetur adipiscing elit. Cras rutrum neque odio, vel viverra lectus vulputate et.
			</Text>
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
		</div>
	),
	triggerButton: 'Open Modal',
	hideCloseButton: false,
	buttonContent: 'Upgrade now',
	secondaryColumn: <img src={ boostImage } alt="Boost" />,
	buttonExternalLink: 'https://jetpack.com',
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
