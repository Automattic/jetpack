import { store as blockEditorStore } from '@wordpress/block-editor';
import { Button, Popover } from '@wordpress/components';
import { dispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
import useGetSiteDetails from '../../use-get-site-details';
import { createBlockFromSubscription } from '../../utils';
import BlogrollAppenderResults from '../blogroll-appender-results';
import BlogrollAppenderSearch from '../blogroll-appender-search';

import './style.scss';
export default function BlogrollAppender( { subscriptions, clientId } ) {
	const [ isVisible, setIsVisible ] = useState( false );
	const [ popoverAnchor, setPopoverAnchor ] = useState();
	const [ searchInput, setSearchInput ] = useState( '' );
	const { insertBlock } = dispatch( 'core/block-editor' );
	const { getBlocks } = useSelect( blockEditorStore );

	const blogrollBlock = getBlocks( clientId );
	const { siteDetails } = useGetSiteDetails( {
		siteURL: searchInput,
		subscriptions,
		enabled: searchInput,
	} );

	// Check if site is already appended to the blogroll
	// If it is, add a duplicateRecommendation flag to the site object
	const blogrollItems = blogrollBlock?.filter( block => block.name === 'jetpack/blogroll-item' );
	const updatedBlogrollItems = siteDetails?.map( site => {
		const itemBlogId = site?.blog_id;
		const itemBlogrollItem = blogrollItems.find( item => {
			return item?.attributes.id === itemBlogId;
		} );
		if ( itemBlogrollItem ) {
			return { ...site, duplicateRecommendation: true };
		}
		return site;
	} );

	const toggleVisible = () => {
		setIsVisible( state => ! state );
	};

	const onSelect = subscription => {
		insertBlock( createBlockFromSubscription( subscription ), undefined, clientId );
		setIsVisible( false );
	};

	return (
		<>
			<Button
				className="block-editor-button-blogroll-block-appender"
				ref={ setPopoverAnchor }
				icon={ plus }
				label={ __( 'Add Blogroll Item', 'jetpack' ) }
				onClick={ toggleVisible }
			/>

			{ isVisible && (
				<Popover anchor={ popoverAnchor } className="jetpack-blogroll__appender">
					<BlogrollAppenderSearch value={ searchInput } onChange={ setSearchInput } />
					<BlogrollAppenderResults
						showPlaceholder={ ! searchInput.trim() }
						results={ updatedBlogrollItems }
						onSelect={ onSelect }
					/>
				</Popover>
			) }
		</>
	);
}
