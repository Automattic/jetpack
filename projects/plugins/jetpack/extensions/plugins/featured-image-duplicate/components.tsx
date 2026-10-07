import { CheckboxControl, Notice } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { PostPreviewButton, store as editorStore } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { HIDE_META_KEY, useFeaturedImageDuplicate } from '.';
import type { ComponentType } from 'react';
import './editor.scss';

/**
 * Notice and checkbox shown under the featured image.
 *
 * @return Content, or null when there's nothing to show.
 */
function FeaturedImageDuplicate() {
	const { postType, isHidden, showNotice, showCheckbox, dismiss, setHidden } =
		useFeaturedImageDuplicate();

	if ( ! showNotice && ! showCheckbox ) {
		return null;
	}

	const isPage = postType === 'page';

	return (
		<div className="jetpack-featured-image-duplicate">
			{ showNotice && (
				<Notice
					status="info"
					onRemove={ dismiss }
					className="jetpack-featured-image-duplicate__notice"
				>
					<p>
						{ isPage
							? __( 'This image is also in your page, so it may appear twice.', 'jetpack' )
							: __( 'This image is also in your post, so it may appear twice.', 'jetpack' ) }
					</p>
					<PostPreviewButton
						className="components-button is-link"
						textContent={ __( 'Preview', 'jetpack' ) }
					/>
				</Notice>
			) }
			{ showCheckbox && (
				<CheckboxControl
					__nextHasNoMarginBottom
					label={
						isPage
							? __( 'Hide featured image on this page', 'jetpack' )
							: __( 'Hide featured image on this post', 'jetpack' )
					}
					help={
						isPage
							? __( 'It still shows as the thumbnail and when the page is shared.', 'jetpack' )
							: __( 'It still shows as the thumbnail and when the post is shared.', 'jetpack' )
					}
					checked={ isHidden }
					onChange={ setHidden }
				/>
			) }
		</div>
	);
}

/**
 * Adds the notice under core's featured image control.
 */
export const withDuplicateNotice = createHigherOrderComponent(
	OriginalComponent => props => (
		<>
			<OriginalComponent { ...props } />
			<FeaturedImageDuplicate />
		</>
	),
	'withDuplicateNotice'
);

/**
 * Stops hiding the featured image once it's no longer in the content.
 *
 * Registered as an editor plugin so it runs even when the sidebar is closed.
 *
 * @return Nothing.
 */
export function HiddenSync() {
	const { isHidden, isDuplicate, isResolved, setHidden } = useFeaturedImageDuplicate();

	useEffect( () => {
		if ( isHidden && isResolved && ! isDuplicate ) {
			setHidden( false );
		}
	}, [ isHidden, isResolved, isDuplicate, setHidden ] );

	return null;
}

type FeaturedImageBlockProps = {
	context?: { postId?: number; queryId?: number };
};

/**
 * The template's Featured Image block, hidden when this post hides its featured image.
 *
 * @param props           - Props.
 * @param props.BlockEdit - Original block edit component.
 * @return The block, or null when hidden.
 */
function FeaturedImageBlock( {
	BlockEdit,
	...props
}: FeaturedImageBlockProps & { BlockEdit: ComponentType< FeaturedImageBlockProps > } ) {
	const { postId, queryId } = props.context ?? {};
	const isHidden = useSelect(
		select => {
			// Inside a Query Loop it's a list of posts, not this post's header.
			if ( queryId !== undefined ) {
				return false;
			}
			const editor = select( editorStore );
			const meta = ( editor.getEditedPostAttribute( 'meta' ) ?? {} ) as Record< string, unknown >;
			return postId === editor.getCurrentPostId() && !! meta[ HIDE_META_KEY ];
		},
		[ postId, queryId ]
	);

	return isHidden ? null : <BlockEdit { ...props } />;
}

/**
 * Hides the template's Featured Image block in the editor too, matching the site.
 */
export const withHiddenFeaturedImageBlock = createHigherOrderComponent(
	BlockEdit => props =>
		props.name === 'core/post-featured-image' ? (
			<FeaturedImageBlock BlockEdit={ BlockEdit } { ...props } />
		) : (
			<BlockEdit { ...props } />
		),
	'withHiddenFeaturedImageBlock'
);
