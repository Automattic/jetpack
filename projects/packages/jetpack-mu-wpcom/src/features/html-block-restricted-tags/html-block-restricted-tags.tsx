import { localizeUrl } from '@automattic/i18n-utils';
import { WpcomSupportLink } from '@automattic/jetpack-shared-extension-utils/components';
import { useBlockProps } from '@wordpress/block-editor';
import { Notice } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { createInterpolateElement, createPortal } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * List of HTML tags that are restricted on Simple sites.
 *
 * @see https://wordpress.com/support/wordpress-editor/blocks/custom-html-block/#supported-code
 */
const RESTRICTED_TAGS = [
	'embed',
	'frame',
	'iframe',
	'form',
	'input',
	'object',
	'textarea',
	'script',
	'style',
	'link',
];

/**
 * Detects if the content contains any restricted HTML tags.
 *
 * @param {string} content - The HTML content to check
 * @return {Array<string>} Array of detected restricted tag names
 */
const detectRestrictedTags = ( content: string ): string[] => {
	if ( ! content ) {
		return [];
	}

	const detectedTags: string[] = [];
	const lowercaseContent = content.toLowerCase();

	for ( const tag of RESTRICTED_TAGS ) {
		// Check for opening tags (e.g., <script or <script> or <script attr="value">)
		const tagPattern = new RegExp( `<${ tag }(?:\\s|>|/)`, 'i' );
		if ( tagPattern.test( lowercaseContent ) ) {
			detectedTags.push( tag );
		}
	}

	return detectedTags;
};

const RestrictedTagsNotice = ( { restrictedTags }: { restrictedTags: string[] } ) => {
	// Build a string with code placeholders for createInterpolateElement.
	const tagsString = restrictedTags.map( tag => `<code>${ tag }</code>` ).join( ', ' );

	return (
		<Notice status="warning" isDismissible={ false }>
			<>
				{ createInterpolateElement(
					sprintf(
						/* translators: %s is a comma-separated list of HTML tag names wrapped in <code> elements */
						_n(
							'The %s tag is not supported on this site.',
							'The following tags are not supported on this site: %s.',
							restrictedTags.length,
							'jetpack-mu-wpcom'
						),
						tagsString
					),
					{
						code: <code />,
					}
				) }{ ' ' }
				<WpcomSupportLink
					supportLink={ localizeUrl(
						'https://wordpress.com/support/wordpress-editor/blocks/custom-html-block/#supported-code'
					) }
				>
					{ __( 'Learn more', 'jetpack-mu-wpcom' ) }
				</WpcomSupportLink>
			</>
		</Notice>
	);
};

const htmlBlockRestrictedTags = createHigherOrderComponent( BlockEdit => {
	return props => {
		const content = props.attributes.content || '';
		const restrictedTags = detectRestrictedTags( content );
		const hasRestrictedTags = restrictedTags.length > 0;

		const { id: blockId } = useBlockProps();
		const editor = window[ 'editor-canvas' ] ? window[ 'editor-canvas' ].document : document;
		const blockElement = editor.getElementById( blockId );

		let noticeContainer = null;
		if ( blockElement ) {
			noticeContainer = blockElement.querySelector( '.wpcom-html-block-restricted-tags-notice' );

			if ( ! noticeContainer ) {
				noticeContainer = editor.createElement( 'div' );
				noticeContainer.classList.add( 'wpcom-html-block-restricted-tags-notice' );
				noticeContainer.style.marginBottom = '8px';
				blockElement.prepend( noticeContainer );
			}
		}

		return (
			<>
				<BlockEdit { ...props } />
				{ hasRestrictedTags &&
					noticeContainer &&
					createPortal(
						<RestrictedTagsNotice restrictedTags={ restrictedTags } />,
						noticeContainer
					) }
			</>
		);
	};
}, 'HtmlBlockRestrictedTags' );

addFilter(
	'blocks.registerBlockType',
	'jetpack-mu-wpcom/html-block-restricted-tags',
	( settings, name ) => {
		if ( name !== 'core/html' ) {
			return settings;
		}

		return {
			...settings,
			edit: htmlBlockRestrictedTags( settings.edit ),
		};
	}
);
