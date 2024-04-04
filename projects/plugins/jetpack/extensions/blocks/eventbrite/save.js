import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const blockProps = useBlockProps.save();
	const { eventId, style, url } = attributes;

	if ( ! eventId ) {
		return;
	}

	if ( style === 'modal' ) {
		return (
			<div { ...blockProps }>
				<InnerBlocks.Content />
			</div>
		);
	}

	return (
		url && (
			<a className="eventbrite__direct-link" href={ url }>
				{ url }
			</a>
		)
	);
}
