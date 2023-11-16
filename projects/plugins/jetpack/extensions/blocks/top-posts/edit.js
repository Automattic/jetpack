import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import { BlockIcon } from '@wordpress/block-editor';
import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import { Placeholder, withNotices } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import metadata from './block.json';
import { TopPostsBlockControls, TopPostsInspectorControls } from './controls';
import { TopPostsSkeleton } from './skeleton';
import './style.scss';

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
	const [ postsData, setPostsData ] = useState();
	const [ postsToDisplay, setPostsToDisplay ] = useState();
	const [ notice, setNotice ] = useState();
	const [ postTypesData, setPostTypesData ] = useState();
	const [ toggleAttributes, setToggleAttributes ] = useState( {} );

	useEffect( () => {
		apiFetch( { path: `/wpcom/v2/post-types` } )
			.then( response => {
				setPostTypesData( response );
				response.forEach( type => {
					console.log( attributes.postTypes );
					console.log( 'fara' );
					if ( attributes.postTypes && attributes.postTypes[ type.id ] ) {
						setToggleAttributes( prevToggleAttributes => ( {
							...prevToggleAttributes,
							[ type.id ]: true,
						} ) );
					}
				} );
			} )
			.catch( error => {
				console.log( error );
			} );
	}, [] );

	useEffect( () => {
		apiFetch( {
			path: `/wpcom/v2/top-posts?timeframe=${ attributes.timeframeRange }&period=${ attributes.period }`,
		} )
			.then( response => {
				updatePostsDisplay( response );
				setPostsData( response );
			} )
			.catch( error => {
				console.log( error );
			} );
	}, [ attributes.timeframeRange, attributes.period ] );

	useEffect( () => {
		updatePostsDisplay( postsData );
	}, [ attributes ] );

	const updatePostsDisplay = data => {
		if ( ! data ) {
			return;
		}

		const newPosts = [];
		for ( let i = 0; i < attributes.postsToShow; i++ ) {
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
		}
		setPostsToDisplay( newPosts );
	};

	/* Call this function when you want to show an error in the placeholder. */
	const setErrorNotice = () => {
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( __( 'Sorry, there was an error.', 'jetpack' ) );
	};

	if ( ! postsToDisplay ) {
		return <TopPostsSkeleton />;
	}

	console.log( 'kitten' );
	console.log( attributes.postTypes );

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
