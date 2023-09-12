import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import SubscribeButton from './subscribe-button';
import './editor.scss';

function Save( { attributes } ) {
	const blockProps = useBlockProps.save();
	const { id, subscribe } = attributes;

	return (
		<div { ...blockProps }>
			<InnerBlocks.Content />
			{ subscribe && <SubscribeButton siteId={ id } /> }
		</div>
	);
}

export default Save;
