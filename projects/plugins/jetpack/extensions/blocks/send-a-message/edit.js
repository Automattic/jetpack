import { InnerBlocks } from '@wordpress/block-editor';

export default function SendAMessageEdit( { className } ) {
	// Default template is single WhatsApp block until we offer
	// more services
	const DEFAULT_TEMPLATE = [ [ 'jetpack/whatsapp-button', {} ] ];
	const ALLOWED_BLOCKS = [ 'jetpack/whatsapp-button' ];

	return (
		<div className={ className }>
			<InnerBlocks template={ DEFAULT_TEMPLATE } allowedBlocks={ ALLOWED_BLOCKS } />
		</div>
	);
}
