import { InnerBlocks } from '@wordpress/block-editor';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import donationMetadata from '../donations/block.json';
import premiumContentMetadata from '../premium-content/block.json';
import recurringPaymentsMetadata from '../recurring-payments/block.json';
import metadata from './block.json';
import edit from './edit';

import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save: () => <InnerBlocks.Content />,
	keywords: [
		...new Set( [
			...metadata.keywords,
			donationMetadata.title,
			...donationMetadata.keywords,
			recurringPaymentsMetadata.title,
			...recurringPaymentsMetadata.keywords,
			premiumContentMetadata.title,
			...premiumContentMetadata.keywords,
		] ),
	],
} );
