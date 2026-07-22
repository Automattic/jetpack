import { InnerBlocks } from '@wordpress/block-editor';
import { CRITERIA_AFTER, DEFAULT_THRESHOLD } from '../../constants';

export default {
	attributes: {
		criteria: {
			type: 'string',
			default: CRITERIA_AFTER,
		},
		threshold: {
			type: 'number',
			default: DEFAULT_THRESHOLD,
		},
	},
	supports: { html: false },
	save: ( { className } ) => {
		return (
			<div className={ className }>
				<InnerBlocks.Content />
			</div>
		);
	},
};
