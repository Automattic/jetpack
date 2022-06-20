import { InnerBlocks } from '@wordpress/block-editor';

export default ( { className } ) => {
	return (
		<div className={ className }>
			<div className="wp-block-jetpack-repeat-visitor__inner-container">
				<InnerBlocks.Content />
			</div>
		</div>
	);
};
