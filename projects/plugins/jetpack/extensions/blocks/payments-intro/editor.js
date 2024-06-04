import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import donationMetadata from '../donations/block.json';
import premiumContentMetadata from '../premium-content/block.json';
import recurringPaymentsMetadata from '../recurring-payments/block.json';
import metadata from './block.json';
import { default as deprecated } from './deprecated';
import edit from './edit';

import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save: () => {
		const blockProps = useBlockProps.save();

		return (
			<div { ...blockProps }>
				<InnerBlocks.Content />
			</div>
		);
	},
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
	deprecated,
} );
