import { InnerBlocks } from '@wordpress/block-editor';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import { settings as donationSettings } from '../donations';
import { settings as premiumContentSettings } from '../premium-content';
import { settings as recurringPaymentSettings } from '../recurring-payments';
import metadata from './block.json';
import edit from './edit';

import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save: () => <InnerBlocks.Content />,
	keywords: [
		...new Set( [
			...metadata.keywords,
			donationSettings.title,
			...donationSettings.keywords,
			recurringPaymentSettings.title,
			...recurringPaymentSettings.keywords,
			premiumContentSettings.title,
			...premiumContentSettings.keywords,
		] ),
	],
} );
