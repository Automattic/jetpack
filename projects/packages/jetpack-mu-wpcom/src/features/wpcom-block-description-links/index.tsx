import { localizeUrl } from '@automattic/i18n-utils';
import { createInterpolateElement } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { JSXElementConstructor, ReactElement } from 'react';
import blockInfoMapping, {
	type BlockLink,
	blockInfoWithVariations,
	childrenBlockInfoWithDifferentUrl,
} from './src/block-links-map';
import DescriptionSupportLink from './src/description-support-link';

const createLocalizedDescriptionWithLearnMore = (
	title: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	description: string | ReactElement< string | JSXElementConstructor< any > >,
	url: string,
	postId: number
) => {
	const localizedUrl = localizeUrl( url );
	const element = createInterpolateElement( '<InlineSupportLink />', {
		InlineSupportLink: (
			<DescriptionSupportLink title={ String( title ) } url={ localizedUrl } postId={ postId }>
				{ description }
			</DescriptionSupportLink>
		),
	} );

	// When the description is used as a string (e.g. inserter search), fall back to the original text.
	// React elements are frozen in dev mode, so we spread into a new object.
	return { ...element, toString: () => String( description ) };
};

/**
 * Check whether info is a flat BlockLink rather than a per-variation map.
 *
 * @param info - Block link info to check.
 * @return Whether info is a BlockLink.
 */
function isBlockLink( info: BlockLink | { [ key: string ]: BlockLink } ): info is BlockLink {
	return (
		typeof ( info as BlockLink ).link === 'string' &&
		typeof ( info as BlockLink ).postId === 'number'
	);
}

const processedBlocks: { [ key: string ]: true } = {};

const addBlockSupportLinks = (
	settings: {
		variations: Array< {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			description: string | ReactElement< string | JSXElementConstructor< any > >;
			name: string;
			title: string;
		} >;
	} & {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[ key: string ]: string | ReactElement< string | JSXElementConstructor< any > >;
	},
	name: string
) => {
	// If block has a parent, use the parents name in the switch. This will apply the link to all nested blocks.
	// The exception is "post content" block because it's used to allow blocks like "more" and "jetpack/paywall" only in post content areas & post editor
	// `parent` is actually an array of strings, so converting to string is going to join multiple blocks together, making the method buggy.
	const parentName = settings?.parent?.toString();
	const isChild = parentName && parentName !== 'core/post-content';
	const blockName = isChild ? parentName : name;

	/**
	 * This is needed because the `blocks.registerBlockType` filter is also triggered for deprecations.
	 *
	 * When the block has deprecations, this filter is triggered multiple times, resulting the Learn more link being appended multiple times.
	 */
	if ( processedBlocks[ name ] ) {
		return settings;
	}

	processedBlocks[ name ] = true;

	const additonalDescLink =
		childrenBlockInfoWithDifferentUrl[ name ]?.link || blockInfoMapping[ blockName ]?.link;

	const additionalDescPostId =
		childrenBlockInfoWithDifferentUrl[ name ]?.postId || blockInfoMapping[ blockName ]?.postId;

	/**
	 * Some elements are children, but have their own url for Learn More, and we want to show those.
	 */
	if ( additonalDescLink && additionalDescPostId ) {
		settings.description = createLocalizedDescriptionWithLearnMore(
			String( settings.title ),
			settings.description,
			additonalDescLink,
			additionalDescPostId
		);
	}

	if (
		blockInfoWithVariations[ name ] &&
		settings.variations &&
		Array.isArray( settings.variations )
	) {
		const variationInfo = blockInfoWithVariations[ name ];

		settings.variations = settings.variations.map( variation => {
			let link: string | undefined;
			let postId: number | undefined;

			if ( isBlockLink( variationInfo ) ) {
				// "Flat" entry: same link for all variations
				link = variationInfo.link;
				postId = variationInfo.postId;
			} else {
				// Per-variation entries: each variation gets its own link
				link = variationInfo[ variation.name ]?.link;
				postId = variationInfo[ variation.name ]?.postId;

				// Default link for embed variations without a specific guide.
				if ( ! link && name === 'core/embed' ) {
					link = 'https://wordpress.com/support/wordpress-editor/blocks/embed-block/';
					postId = 150644;
				} else if ( ! link ) {
					return variation;
				}
			}

			if ( ! variation.description ) {
				return variation;
			}

			variation.description = createLocalizedDescriptionWithLearnMore(
				variation.title,
				variation.description,
				link,
				postId
			);

			return variation;
		} );
	}

	return settings;
};

addFilter(
	'blocks.registerBlockType',
	'jetpack-mu-wpcom/add-block-support-link',
	addBlockSupportLinks
);
