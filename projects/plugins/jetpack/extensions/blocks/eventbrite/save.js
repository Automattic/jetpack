import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const blockProps = useBlockProps.save();
	const { eventId, style, url } = attributes;

	if ( ! eventId ) {
		return;
	}

	let content;

	if ( style === 'modal' ) {
		content = <InnerBlocks.Content />;
	} else if ( url ) {
		content = (
			<a className="eventbrite__direct-link" href={ url }>
				{ url }
			</a>
		);
	}

	return <div { ...blockProps }>{ content }</div>;
}
