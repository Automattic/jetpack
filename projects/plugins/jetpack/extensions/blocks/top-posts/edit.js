import apiFetch from '@wordpress/api-fetch';
import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import { BlockIcon } from '@wordpress/block-editor';
import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import { Placeholder, withNotices } from '@wordpress/components';
import { TopPostsBlockControls, TopPostsInspectorControls } from './controls';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { TopPostsSkeleton } from './skeleton';
import metadata from './block.json';
import './editor.scss';

function TopPostsPreviewItem( props ) {
	return (
		<div className="jetpack-top-posts-item">
			<a className="jetpack-top-posts-title">{ props.title }</a>
			<span className="jetpack-top-posts-date">{ props.date }</span>
		</div>
	);
} 

function TopPostsEdit( { attributes, className, noticeOperations, noticeUI, setAttributes } ) {
	const [ postsToDisplay, setPostsToDisplay ] = useState();
	const [ notice, setNotice ] = useState();

	useEffect(() => {
		apiFetch({ path: `/wpcom/v2/top-posts` })
		  .then( ( response ) => {
			const newPosts = [];
			for (let i = 0; i < 3; i++) {
			  newPosts.push(
			  <TopPostsPreviewItem
					key={ 'jetpack-top-posts-' + response[i].id }
					title={ response[i].title }
					date={ response[i].date }
			  />);
			}
			setPostsToDisplay( newPosts );
		  })
		  .catch(() => {
			setErrorNotice();
		  });
	  }, []);
	  
	/* Call this function when you want to show an error in the placeholder. */
	const setErrorNotice = () => {
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( __( 'Put error message here.', 'jetpack' ) );
	};

	if ( ! postsToDisplay ) {
		return <TopPostsSkeleton />;
	}

	return (
		<>
			<InspectorControls>
				<TopPostsInspectorControls attributes={ attributes } setAttributes={ setAttributes } />
			</InspectorControls>

			<BlockControls>
				<TopPostsBlockControls attributes={ attributes } setAttributes={ setAttributes } />
			</BlockControls>

			<div className={ className }>
				<div className="jetpack-top-posts-wrapper">
					{ postsToDisplay }
				</div>
			</div>
		</>
	);
}

export default TopPostsEdit;
