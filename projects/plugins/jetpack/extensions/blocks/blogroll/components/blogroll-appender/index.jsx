import { Button, Popover, Spinner } from '@wordpress/components';
import { dispatch, select } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
import useGetSiteDetails from '../../use-get-site-details';
import { createBlockFromSubscription, discoverFeedUrl } from '../../utils';
import BlogrollAppenderResults from '../blogroll-appender-results';
import BlogrollAppenderSearch from '../blogroll-appender-search';

import './style.scss';
export default function BlogrollAppender( { isLoading, subscriptions, clientId } ) {
	const [ isVisible, setIsVisible ] = useState( false );
	const [ popoverAnchor, setPopoverAnchor ] = useState();
	const [ searchInput, setSearchInput ] = useState( '' );
	const { insertBlock, updateBlockAttributes } = dispatch( 'core/block-editor' );
	const { siteDetails, isLoading: isLoadingSiteDetails } = useGetSiteDetails( {
		siteURL: searchInput,
		subscriptions,
		enabled: searchInput,
	} );

	const toggleVisible = () => {
		setIsVisible( state => ! state );
	};

	const onSelect = subscription => {
		const block = createBlockFromSubscription( subscription );
		insertBlock( block, undefined, clientId );
		setIsVisible( false );

		if ( block.attributes.feed_url || ! block.attributes.url ) {
			return;
		}

		// Discovery can take a few seconds, so only fill the field if it is still empty.
		discoverFeedUrl( block.attributes.url ).then( feedUrl => {
			const attributes = select( 'core/block-editor' ).getBlockAttributes( block.clientId );
			if ( feedUrl && attributes && ! attributes.feed_url ) {
				updateBlockAttributes( block.clientId, { feed_url: feedUrl } );
			}
		} );
	};

	if ( isLoading ) {
		return <Spinner className="jetpack-blogroll__appender-spinner" />;
	}

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
						results={ siteDetails }
						onSelect={ onSelect }
						searchInput={ searchInput }
						isLoading={ isLoadingSiteDetails }
					/>
				</Popover>
			) }
		</>
	);
}
