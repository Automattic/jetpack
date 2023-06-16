import { createBlock, serialize } from '@wordpress/blocks';
import { useEntityRecord } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import createBlocksFromTemplate from '../../shared/create-block-from-inner-blocks-template';
import { name as blockName } from './index';
export const PART_SLUG = 'cookie-consent-block-template-part';
export const DEFAULT_INNER_BLOCKS = [
	[
		'core/button',
		{
			text: __( 'Accept', 'jetpack' ),
		},
	],
];

export const openTemplate = template => {
	window.open( `/wp-admin/site-editor.php?postType=${ template.type }&postId=${ template.id }` );
};
export const createTemplatePart = ( attributes, innerBlocks ) => {
	return {
		slug: PART_SLUG,
		description: __( 'Contains the cookie consent block.', 'jetpack' ),
		title: __( 'Cookie Consent Block Template Part', 'jetpack' ),
		content: serialize(
			createBlock(
				`jetpack/${ blockName }`,
				{
					...attributes,
					isInWarningState: false,
					lock: {
						move: true,
						remove: true,
					},
				},
				innerBlocks.length ? innerBlocks : createBlocksFromTemplate( DEFAULT_INNER_BLOCKS )
			)
		),
		area: 'footer',
	};
};

/**
 * Fetches the template part for the cookie consent block
 *
 * @returns {object} { part, isLoading }
 */
export const useCookieConsentTemplatePart = () => {
	const theme = useSelect( select => select( 'core' ).getCurrentTheme() );
	const { record, isResolving } = useEntityRecord(
		'postType',
		'wp_template_part',
		`${ theme?.stylesheet }//${ PART_SLUG }`,
		{
			enabled: !! theme,
		}
	);

	return { part: record, isLoading: ! theme || isResolving };
};

/* If the block is added in the right place (in its own part), mark it as such, this is needed in the save function */
export const useWarningState = innerBlocks => {
	const parentPost = useSelect( select => {
		const id = select( 'core/edit-site' ).getEditedPostId();
		const type = select( 'core/edit-site' ).getEditedPostType();
		return select( 'core' ).getEntityRecord( 'postType', type, id );
	}, [] );

	if ( parentPost && ! innerBlocks.length ) {
		return parentPost?.slug !== PART_SLUG;
	}

	return false;
};
