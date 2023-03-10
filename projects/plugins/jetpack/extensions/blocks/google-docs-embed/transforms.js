import { createBlock } from '@wordpress/blocks';
import { renderToString } from '@wordpress/element';

const transforms = name => {
	const patterns = [
		/^(http|https):\/\/(docs\.google.com)\/(spreadsheets|document|presentation)\/d\/([A-Za-z0-9_-]+).*?$/i,
	];
	return {
		from: [
			{
				type: 'raw',
				isMatch: node =>
					node.nodeName === 'P' &&
					patterns[ 0 ].test( node.textContent ) &&
					node.textContent?.match( /https/gi )?.length === 1,
				transform: node => {
					return createBlock( name, {
						url: node.textContent.trim(),
					} );
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( { url } ) => {
					const link = <a href={ url }>{ url }</a>;
					return createBlock( 'core/paragraph', {
						content: renderToString( link ),
					} );
				},
			},
		],
	};
};

export default transforms;
