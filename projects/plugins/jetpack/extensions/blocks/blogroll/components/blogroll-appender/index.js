import { Button, Popover } from '@wordpress/components';
import { dispatch } from '@wordpress/data';
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
	const { siteDetails } = useGetSiteDetails( searchInput );
	let results = subscriptions ?? [];

	const toggleVisible = () => {
		setIsVisible( state => ! state );
	};

	const onSelect = subscription => {
		insertBlock( createBlockFromSubscription( subscription ), undefined, clientId );
		setIsVisible( false );
	};

	const searchQuery = searchInput.toLowerCase().trim();

	if ( searchQuery.length > 0 ) {
		const existInSubscriptions = subscriptions.filter( item => {
			const nameContainsSearch = item.name.toLowerCase().includes( searchQuery.toLowerCase() );
			const urlContainsSearch = item.URL.toLowerCase().includes( searchQuery.toLowerCase() );

			return nameContainsSearch || urlContainsSearch;
		} );

		results = existInSubscriptions;

		if ( siteDetails ) {
			results.unshift( {
				id: siteDetails?.ID,
				description: siteDetails?.description,
				URL: siteDetails?.URL,
				site_icon: siteDetails?.site_icon,
				name: siteDetails?.name,
			} );
		}
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
				<Popover anchor={ popoverAnchor }>
					<form
						className="jetpack-blogroll__appender"
						role="search"
						onSubmit={ event => {
							event.preventDefault();
							setIsVisible( false );
						} }
					>
						<BlogrollAppenderSearch value={ searchInput } onChange={ setSearchInput } />
						<BlogrollAppenderResults
							showPlaceholder={ ! searchInput.trim() }
							subscriptions={ results }
							onSelect={ onSelect }
						/>
					</form>
				</Popover>
			) }
		</>
	);
}
