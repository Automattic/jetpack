import { createBlock } from '@wordpress/blocks';
import { Button } from '@wordpress/components';
import { renderToString } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/*
	Fallback behaviour for unembeddable URLs.
	Creates a paragraph block containing a link to the URL, and calls `onReplace`.
 */
export default function ErrorNotice( { fallbackUrl, onClick } ) {
	const handleOnButtonClick = () => {
		const link = <a href={ fallbackUrl }>{ fallbackUrl }</a>;
		onClick( createBlock( 'core/paragraph', { content: renderToString( link ) } ) );
	};
	return (
		<>
			{ __( 'Sorry, this content could not be embedded.', 'jetpack' ) }{ ' ' }
			<Button variant="link" onClick={ handleOnButtonClick }>
				{ _x( 'Convert block to link', 'button label', 'jetpack' ) }
			</Button>
		</>
	);
}
