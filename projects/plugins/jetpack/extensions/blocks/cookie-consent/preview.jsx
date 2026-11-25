import {
	store as blockEditorStore,
	useBlockEditingMode,
	useBlockProps,
} from '@wordpress/block-editor';
import { getSaveElement } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { RawHTML } from '@wordpress/element';
import { Fragment } from 'react';
import { DEFAULT_TEXT } from './constants';

export default function CookieConsentPreview( {
	attributes: { align, text = DEFAULT_TEXT },
	clientId,
} ) {
	useBlockEditingMode( 'disabled' );
	const blockProps = useBlockProps( {
		className: `wp-block-jetpack-cookie-consent align${ align }`,
	} );
	// Render saved buttons without mounting their editing controls.
	const innerBlocks = useSelect(
		select => select( blockEditorStore ).getBlocks( clientId ),
		[ clientId ]
	);

	return (
		<div { ...blockProps }>
			<RawHTML>{ `<p>${ text }</p>` }</RawHTML>
			{ innerBlocks
				.filter( block => block.name === 'core/button' )
				.map( ( { name, attributes, clientId: buttonId } ) => (
					<Fragment key={ buttonId }>
						{ getSaveElement( name, { ...attributes, tagName: 'a', url: undefined } ) }
					</Fragment>
				) ) }
		</div>
	);
}
