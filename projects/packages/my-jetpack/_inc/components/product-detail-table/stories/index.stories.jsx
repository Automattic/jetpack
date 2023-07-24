/* eslint-disable react/react-in-jsx-scope */
import React from 'react';
import ProductDetailTable from '../index.jsx';
import { getAllMockData } from './utils.js';

export default {
	title: 'Packages/My Jetpack/Product Detail Table',
	component: ProductDetailTable,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		Story => (
			<div style={ { maxWidth: '1120px' } }>
				<Story />
			</div>
		),
	],
};

const mockData = getAllMockData();

const BoostTemplate = args => <ProductDetailTable { ...args } slug="boost" />;
export const jetpackBoost = BoostTemplate.bind( {} );
jetpackBoost.parameters = { mockData };

const ProtectTemplate = args => <ProductDetailTable { ...args } slug="protect" />;
export const JetpackProtect = ProtectTemplate.bind( {} );
JetpackProtect.parameters = { mockData };

const SocialTemplate = args => <ProductDetailTable { ...args } slug="social" />;
export const JetpackSocial = SocialTemplate.bind( {} );
JetpackSocial.parameters = { mockData };
