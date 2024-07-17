import { useModuleStatus } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import { BlockControls, InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { useState, useEffect } from '@wordpress/element';
import clsx from 'clsx';
import { LoadingPostsGrid } from '../../shared/components/loading-posts-grid';
import { TopPostsBlockControls, TopPostsInspectorControls } from './controls';
import { InactiveStatsPlaceholder } from './inactive-placeholder';
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
			{ props.displayThumbnail && ! props.thumbnail && (
				<a className="jetpack-top-posts-thumbnail-link">
					<div className="jetpack-top-posts-mock-thumbnail"></div>
				</a>
			) }
			<span className="jetpack-top-posts-title">
				<a>{ props.title }</a>
			</span>
			{ props.displayDate && (
				<span className="jetpack-top-posts-date has-small-font-size">{ props.date }</span>
			) }
			{ props.displayAuthor && (
				<span className="jetpack-top-posts-author has-small-font-size">{ props.author }</span>
			) }
			{ props.displayContext && props.context && (
				<span className="jetpack-top-posts-context has-small-font-size">
					<a>{ props.context[ 0 ].cat_name }</a>
				</span>
			) }
		</div>
	);
}

function TopPostsEdit( { attributes, setAttributes } ) {
	const { isLoadingModules, isChangingStatus, isModuleActive, changeStatus } =
		useModuleStatus( 'stats' );
	const blockProps = useBlockProps();
	const { className } = blockProps;

	const [ postsData, setPostsData ] = useState();
	const [ postsToDisplay, setPostsToDisplay ] = useState();
	const [ postTypesData, setPostTypesData ] = useState();
	const [ toggleAttributes, setToggleAttributes ] = useState( {} );

	const {
		displayAuthor,
		displayContext,
		displayDate,
		displayThumbnail,
		layout,
		period,
		postsToShow,
		postTypes,
	} = attributes;

	useEffect( () => {
		apiFetch( { path: `/wpcom/v2/post-types` } ).then( response => {
			setPostTypesData( response );
			response.forEach( type => {
				if ( postTypes && postTypes[ type.id ] ) {
					setToggleAttributes( prevToggleAttributes => ( {
						...prevToggleAttributes,
						[ type.id ]: true,
					} ) );
				}
			} );
		} );
	}, [ postTypes ] );

	useEffect( () => {
		if ( isModuleActive ) {
			apiFetch( {
				path: `/wpcom/v2/top-posts?period=${ period }`,
			} ).then( response => {
				setPostsData( response );
			} );
		}
	}, [ period, isModuleActive ] );

	useEffect( () => {
		const data = postsData;

		if ( ! data ) {
			return;
		}

		const newPosts = [];
		for ( let i = 0; newPosts.length !== postsToShow; i++ ) {
			if ( data[ i ] && postTypes[ data[ i ].type ] ) {
				newPosts.push(
					<TopPostsPreviewItem
						key={ 'jetpack-top-posts-' + data[ i ].id }
						title={ data[ i ].title }
						date={ data[ i ].date }
						author={ data[ i ].author }
						thumbnail={ data[ i ].thumbnail }
						context={ data[ i ].context }
						displayDate={ displayDate }
						displayAuthor={ displayAuthor }
						displayThumbnail={ displayThumbnail }
						displayContext={ displayContext }
					/>
				);
			}

			// Out of posts.
			if ( ! data[ i ] ) {
				break;
			}
		}

		setPostsToDisplay( newPosts );
	}, [
		displayAuthor,
		displayContext,
		displayDate,
		displayThumbnail,
		postsData,
		postTypes,
		postsToShow,
		setPostsToDisplay,
	] );

	let content;

	if ( ! isModuleActive && ! isLoadingModules ) {
		content = (
			<InactiveStatsPlaceholder
				className={ className }
				changeStatus={ changeStatus }
				isLoading={ isChangingStatus }
			/>
		);
	} else if ( ! postsToDisplay ) {
		content = <LoadingPostsGrid />;
	} else {
		content = (
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

				<div data-item-count={ postsToDisplay.length }>
					<div className="jetpack-top-posts-wrapper">{ postsToDisplay }</div>
				</div>
			</>
		);
	}

	return (
		<div { ...blockProps } className={ clsx( className, `is-${ layout }-layout` ) }>
			{ content }
		</div>
	);
}

export default TopPostsEdit;
