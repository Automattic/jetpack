import { useModuleStatus } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import { TopPostsBlockControls, TopPostsInspectorControls } from './controls';
import { InactiveStatsPlaceholder } from './inactive-placeholder';
import { TopPostsSkeleton } from './skeleton';
import './style.scss';
import './editor.scss';

function TopPostsPreviewItem( props ) {
	return (
		<div className="jetpack-top-posts-item">
			{ props.displayThumbnail && props.thumbnail && (
				<a className="jetpack-top-posts-thumbnail-link">
					<img
						className="jetpack-top-posts-thumbnail"
						src={ props.thumbnail }
						alt={ props.title }
						rel="nofollow noopener noreferrer"
						target="_blank"
					/>
				</a>
			) }
			<a className="jetpack-top-posts-title">{ props.title }</a>
			{ props.displayDate && (
				<span className="jetpack-top-posts-date has-small-font-size">{ props.date }</span>
			) }
			{ props.displayAuthor && (
				<span className="jetpack-top-posts-author has-small-font-size">{ props.author }</span>
			) }
			{ props.displayContext && props.context && (
				<a className="jetpack-top-posts-context has-small-font-size">
					{ props.context[ 0 ].cat_name }
				</a>
			) }
		</div>
	);
}

function TopPostsEdit( { attributes, className, noticeOperations, noticeUI, setAttributes } ) {
	const { isLoadingModules, isChangingStatus, isModuleActive, changeStatus } =
		useModuleStatus( 'stats' );

	const [ postsData, setPostsData ] = useState();
	const [ postsToDisplay, setPostsToDisplay ] = useState();
	const [ postTypesData, setPostTypesData ] = useState();
	const [ toggleAttributes, setToggleAttributes ] = useState( {} );

	useEffect( () => {
		apiFetch( { path: `/wpcom/v2/post-types` } ).then( response => {
			setPostTypesData( response );
			response.forEach( type => {
				if ( attributes.postTypes && attributes.postTypes[ type.id ] ) {
					setToggleAttributes( prevToggleAttributes => ( {
						...prevToggleAttributes,
						[ type.id ]: true,
					} ) );
				}
			} );
		} );
	}, [] );

	useEffect( () => {
		if ( isModuleActive ) {
			apiFetch( {
				path: `/wpcom/v2/top-posts?period=${ attributes.period }`,
			} ).then( response => {
				updatePostsDisplay( response );
				setPostsData( response );
			} );
		}
	}, [ attributes.period, isModuleActive ] );

	useEffect( () => {
		updatePostsDisplay( postsData );
		console.log( attributes.period );
	}, [ attributes ] );

	const updatePostsDisplay = data => {
		if ( ! data ) {
			return;
		}

		const newPosts = [];
		for ( let i = 0; newPosts.length !== attributes.postsToShow; i++ ) {
			if ( data[ i ] && attributes.postTypes[ data[ i ].type ] ) {
				newPosts.push(
					<TopPostsPreviewItem
						key={ 'jetpack-top-posts-' + data[ i ].id }
						title={ data[ i ].title }
						date={ data[ i ].date }
						author={ data[ i ].author }
						thumbnail={ data[ i ].thumbnail }
						context={ data[ i ].context }
						displayDate={ attributes.displayDate }
						displayAuthor={ attributes.displayAuthor }
						displayThumbnail={ attributes.displayThumbnail }
						displayContext={ attributes.displayContext }
					/>
				);
			}

			// Out of posts.
			if ( ! data[ i ] ) {
				break;
			}
		}

		setPostsToDisplay( newPosts );
	};

	console.log( isLoadingModules );
	console.log( 'edsdsf' );

	if ( ! isModuleActive && ! isLoadingModules ) {
		return (
			<InactiveStatsPlaceholder
				className={ className }
				changeStatus={ changeStatus }
				isLoading={ isChangingStatus }
			/>
		);
	}

	if ( ! postsToDisplay ) {
		return <TopPostsSkeleton />;
	}

	return (
		<>
			<InspectorControls>
				<TopPostsInspectorControls
					attributes={ attributes }
					setAttributes={ setAttributes }
					toggleAttributes={ toggleAttributes }
					setToggleAttributes={ setToggleAttributes }
					postTypesData={ postTypesData }
				/>
			</InspectorControls>

			<BlockControls>
				<TopPostsBlockControls attributes={ attributes } setAttributes={ setAttributes } />
			</BlockControls>

			<div className={ classNames( className, `is-${ attributes.layout }-layout` ) }>
				<div className="jetpack-top-posts-wrapper">{ postsToDisplay }</div>
			</div>
		</>
	);
}

export default TopPostsEdit;
