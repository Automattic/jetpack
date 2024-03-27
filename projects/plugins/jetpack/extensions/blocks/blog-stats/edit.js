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
	const { label, statsData, statsOption } = attributes;
	const [ blogViews, setBlogViews ] = useState( null );
	const [ blogVisitors, setBlogVisitors ] = useState();
	const [ postViews, setPostViews ] = useState();

	const blogStats = statsData === 'views' ? blogViews : blogVisitors;
	const stats = statsOption === 'post' ? postViews : blogStats;

	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId(), [] );

	useEffect( () => {
		if ( isModuleActive ) {
			apiFetch( {
				path: Number.isInteger( postId )
					? `/wpcom/v2/blog-stats?post_id=${ postId }`
					: '/wpcom/v2/blog-stats',
			} ).then( response => {
				setBlogViews( response[ 'blog-views' ] );
				setBlogVisitors( response[ 'blog-visitors' ] );

				// Display "12,345" as an obvious placeholder when we have no Post ID.
				// Applies to widgets, FSE templates etc.
				setPostViews( Number.isInteger( postId ) ? response[ 'post-views' ] : '12345' );
			} );
		}
	}, [ postId, isModuleActive ] );

	// We don't collect visitor data for individual posts.
	useEffect( () => {
		if ( statsData === 'visitors' ) {
			setAttributes( { statsOption: 'site' } );
		}
	}, [ statsData, setAttributes ] );

	if ( ! isModuleActive && ! isLoadingModules ) {
		return (
			<InactiveStatsPlaceholder
				className={ className }
				changeStatus={ changeStatus }
				isLoading={ isChangingStatus }
			/>
		);
	}

	const visitorsPlaceholder =
		/* Translators: Number of visitors */
		_n( 'visitor', 'visitors', parseInt( stats ), 'jetpack', 0 );

	const viewsPlaceholder =
		/* Translators: Number of views */
		_n( 'hit', 'hits', parseInt( stats ), 'jetpack', 0 );

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
						<span>{ numberFormat( stats ) } </span>
						<RichText
							tagName="span"
							placeholder={ statsData === 'visitors' ? visitorsPlaceholder : viewsPlaceholder }
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
