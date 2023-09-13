import { InnerBlocks } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

function getContent( { openLinksNewWindow, name, url } ) {
	const target = openLinksNewWindow ? '_blank' : '_self';
	return `<a href="${ url }" target="${ target }" rel="noopener noreferrer">${ name || '' }</a>`;
}

function BlogrollNameEdit( { context, clientId } ) {
	const { name, url, openLinksNewWindow } = context;
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	const getBlock = useSelect(
		select => () => select( 'core/block-editor' ).getBlock( clientId ),
		[ clientId ]
	);

	useEffect( () => {
		const block = getBlock();

		if ( block.innerBlocks.length === 1 ) {
			updateBlockAttributes( block.innerBlocks[ 0 ].clientId, {
				content: getContent( { openLinksNewWindow, name, url } ),
			} );
		}
	}, [ openLinksNewWindow, name, url, getBlock, updateBlockAttributes ] );

	return (
		<InnerBlocks
			allowedBlocks={ [ 'core/paragraph' ] }
			template={ [
				[
					'core/paragraph',
					{
						style: {
							typography: { fontSize: '16px', fontStyle: 'normal', fontWeight: '500' },
							elements: { link: { color: { text: '#101517' } } },
							spacing: { margin: { top: '0px', bottom: '0px' } },
						},
						content: getContent( { openLinksNewWindow, name, url } ),
					},
				],
			] }
		/>
	);
}

export default BlogrollNameEdit;
