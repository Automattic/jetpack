import { parseWithAttributeSchema } from '@wordpress/blocks';
import { addFilter, removeFilter } from '@wordpress/hooks';

const FILTER_NAMESPACE = 'jetpack/videopress-native-video-html-sources';

// Registering these sources would drop comment-backed VideoPress values.
let htmlSourcedAttributes = {};

function htmlSourcedAttributeSchemas( attributes = {} ) {
	return Object.fromEntries(
		Object.entries( attributes ).filter( ( [ , schema ] ) => schema?.source )
	);
}

function readHtmlSourcedAttributes( innerHTML ) {
	return Object.fromEntries(
		Object.entries( htmlSourcedAttributes ).map( ( [ key, schema ] ) => {
			const value = parseWithAttributeSchema( innerHTML, schema );
			if ( value === undefined && Object.prototype.hasOwnProperty.call( schema, 'default' ) ) {
				return [ key, schema.default ];
			}
			return [ key, value ];
		} )
	);
}

export function applyNativeVideoHtmlSources(
	blockAttributes,
	blockType,
	innerHTML,
	commentAttributes
) {
	if (
		blockType?.name !== 'core/video' ||
		commentAttributes?.guid ||
		blockAttributes?.guid ||
		typeof innerHTML !== 'string' ||
		! innerHTML.includes( '<video' )
	) {
		return blockAttributes;
	}

	return {
		...blockAttributes,
		...readHtmlSourcedAttributes( innerHTML ),
	};
}

export function registerNativeVideoHtmlSources( attributes ) {
	htmlSourcedAttributes = htmlSourcedAttributeSchemas( attributes );
	removeFilter( 'blocks.getBlockAttributes', FILTER_NAMESPACE );
	addFilter( 'blocks.getBlockAttributes', FILTER_NAMESPACE, applyNativeVideoHtmlSources );
}

export function unregisterNativeVideoHtmlSources() {
	htmlSourcedAttributes = {};
	removeFilter( 'blocks.getBlockAttributes', FILTER_NAMESPACE );
}
