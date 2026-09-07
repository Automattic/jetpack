import { useBlockProps } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import deprecatedV1 from './deprecated/v1';
import deprecatedV2 from './deprecated/v2';
import edit from './edit';
import { getStyleOptions } from './styles';
import { getAttributesFromEmbedCode, restRefRegex, ridRegex } from './utils';

import './editor.scss';
import './view.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save: ( { attributes: { rid } } ) => {
		const blockProps = useBlockProps.save();

		return (
			<div { ...blockProps }>
				{ rid?.map( ( restaurantId, restaurantIndex ) => (
					<a
						href={ `https://www.opentable.com/restref/client/?rid=${ restaurantId }` }
						key={ `${ restaurantId }-${ restaurantIndex }` }
					>
						{ `https://www.opentable.com/restref/client/?rid=${ restaurantId }` }
					</a>
				) ) }
			</div>
		);
	},
	attributes: metadata.attributes,
	styles: getStyleOptions(),
	transforms: {
		from: [
			{
				type: 'raw',
				isMatch: node =>
					node.nodeName === 'P' &&
					node.textContent.indexOf( 'http' ) === 0 &&
					( ridRegex.test( node.textContent ) || restRefRegex.test( node.textContent ) ),
				transform: node => {
					const newAttributes = getAttributesFromEmbedCode( node.textContent );
					return createBlock( 'jetpack/opentable', newAttributes );
				},
			},
		],
	},
	deprecated: [ deprecatedV1, deprecatedV2 ],
} );
