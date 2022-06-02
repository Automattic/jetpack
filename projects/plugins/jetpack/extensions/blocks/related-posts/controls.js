import { PanelBody, RangeControl, ToggleControl, ToolbarGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const MAX_POSTS_TO_SHOW = 6;

export function RelatedPostsInspectorControls( { attributes, setAttributes } ) {
	const { displayContext, displayDate, displayThumbnails, postsToShow } = attributes;

	return (
		<PanelBody title={ __( 'Related Posts Settings', 'jetpack' ) }>
			<ToggleControl
				label={ __( 'Display thumbnails', 'jetpack' ) }
				checked={ displayThumbnails }
				onChange={ value => setAttributes( { displayThumbnails: value } ) }
			/>
			<ToggleControl
				label={ __( 'Display date', 'jetpack' ) }
				checked={ displayDate }
				onChange={ value => setAttributes( { displayDate: value } ) }
			/>
			<ToggleControl
				label={ __( 'Display context (category or tag)', 'jetpack' ) }
				checked={ displayContext }
				onChange={ value => setAttributes( { displayContext: value } ) }
			/>
			<RangeControl
				label={ __( 'Number of posts', 'jetpack' ) }
				value={ postsToShow }
				onChange={ value => setAttributes( { postsToShow: Math.min( value, MAX_POSTS_TO_SHOW ) } ) }
				min={ 1 }
				max={ MAX_POSTS_TO_SHOW }
			/>
		</PanelBody>
	);
}

export function RelatedPostsBlockControls( { attributes, setAttributes } ) {
	const { postLayout } = attributes;
	const layoutControls = [
		{
			icon: 'grid-view',
			title: __( 'Grid View', 'jetpack' ),
			onClick: () => setAttributes( { postLayout: 'grid' } ),
			isActive: postLayout === 'grid',
		},
		{
			icon: 'list-view',
			title: __( 'List View', 'jetpack' ),
			onClick: () => setAttributes( { postLayout: 'list' } ),
			isActive: postLayout === 'list',
		},
	];

	return <ToolbarGroup controls={ layoutControls } />;
}
