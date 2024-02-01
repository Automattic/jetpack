import { numberFormat } from '@automattic/jetpack-components';
import { useModuleStatus } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import { InspectorControls, RichText } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __, _n } from '@wordpress/i18n';
import { BlogStatsInspectorControls } from './controls';
import { InactiveStatsPlaceholder } from './inactive-placeholder';

function BlogStatsEdit( { attributes, className, setAttributes } ) {
	const { isLoadingModules, isChangingStatus, isModuleActive, changeStatus } =
		useModuleStatus( 'stats' );
	const { label, statsOption } = attributes;
	const [ blogViews, setBlogViews ] = useState( null );
	const [ postViews, setPostViews ] = useState();
	const views = statsOption === 'post' ? postViews : blogViews;

	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId(), [] );

	useEffect( () => {
		if ( isModuleActive ) {
			apiFetch( {
				path: Number.isInteger( postId )
					? `/wpcom/v2/blog-stats?post_id=${ postId }`
					: '/wpcom/v2/blog-stats',
			} ).then( response => {
				setBlogViews( response[ 'blog-views' ] );

				// Display "12,345" as an obvious placeholder when we have no Post ID.
				// Applies to widgets, FSE templates etc.
				setPostViews( Number.isInteger( postId ) ? response[ 'post-views' ] : '12345' );
			} );
		}
	}, [ postId, isModuleActive ] );

	if ( ! isModuleActive && ! isLoadingModules ) {
		return (
			<InactiveStatsPlaceholder
				className={ className }
				changeStatus={ changeStatus }
				isLoading={ isChangingStatus }
			/>
		);
	}

	return (
		<>
			<InspectorControls>
				<BlogStatsInspectorControls attributes={ attributes } setAttributes={ setAttributes } />
			</InspectorControls>

			<div className={ className }>
				{ isLoadingModules || blogViews === null ? (
					<p className="jetpack-blog-stats__loading">{ __( 'Loading stats…', 'jetpack' ) }</p>
				) : (
					<p>
						<span>{ numberFormat( views ) } </span>
						<RichText
							tagName="span"
							placeholder={
								/* Translators: Number of views */
								_n( 'hit', 'hits', parseInt( views ), 'jetpack' )
							}
							value={ label }
							allowedFormats={ [ 'core/bold', 'core/italic', 'core/link' ] }
							onChange={ newLabel => setAttributes( { label: newLabel } ) }
						/>
					</p>
				) }
			</div>
		</>
	);
}

export default BlogStatsEdit;
