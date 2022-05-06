/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import ProductOffer from '../../product-offer';
import Dialog from '..';
import BoostImage from './boost.png';

export default {
	title: 'JS Packages/Components/Dialog',
	component: Dialog,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		layout: 'centered',
	},
	argTypes: {
		primary: {
			table: {
				disable: true,
			},
		},
		secondary: {
			table: {
				disable: true,
			},
		},
		split: {
			table: {
				disable: true,
			},
		},
	},
};

const Template = args => <Dialog { ...args } />;

export const InterstitialJetpackBoost = Template.bind( {} );
InterstitialJetpackBoost.parameters = {};
InterstitialJetpackBoost.args = {
	primary: (
		<ProductOffer
			slug="boost"
			name="Boost"
			title="Jepack Boost"
			description="Jetpack Boost gives your site the same performance advantages as the world’s leading websites, no developer required."
			features={ [
				'Check your site performance',
				'Enable improvements in one click',
				'Standalone free plugin for those focused on speed',
			] }
			pricing={ {
				isFree: true,
			} }
			className={ '' }
			icon={ '' }
			isCard={ false }
			supportedProducts={ [] }
			hasRequiredPlan={ false }
			addProductUrl={ '' }
		/>
	),
	secondary: <img src={ BoostImage } alt="Boost" />,
	split: false,
};

export const InterstitialJetpackBackup = Template.bind( {} );
InterstitialJetpackBackup.parameters = {};
InterstitialJetpackBackup.args = {
	primary: (
		<ProductOffer
			slug="boost"
			name="Boost"
			title="Jepack Boost"
			description="Jetpack Boost gives your site the same performance advantages as the world’s leading websites, no developer required."
			features={ [
				'Check your site performance',
				'Enable improvements in one click',
				'Standalone free plugin for those focused on speed',
			] }
			pricing={ {
				isFree: true,
			} }
			isCard={ true }
			className={ '' }
			icon={ '' }
			supportedProducts={ [] }
			hasRequiredPlan={ false }
			addProductUrl={ '' }
		/>
	),
	secondary: (
		<ProductOffer
			slug="security"
			name="Security"
			title="Security"
			description="Comprehensive site security, including Backup, Scan, and Anti-spam."
			isBundle={ true }
			supportedProducts={ [ 'backup', 'scan', 'anti-spam' ] }
			features={ [
				'Real time cloud backups with 10GB storage',
				'Automated real-time malware scan',
				'One click fixes for most threats',
				'Comment & form spam protection',
			] }
			pricing={ {
				currency: 'USD',
				price: 24.92,
				offPrice: 12.42,
			} }
			hasRequiredPlan={ false }
			isLoading={ false }
			className={ '' }
			icon={ '' }
			isCard={ false }
			addProductUrl={ '' }
		/>
	),
	split: true,
};
