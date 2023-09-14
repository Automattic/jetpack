import { Button, Popover } from '@wordpress/components';
import { dispatch } from '@wordpress/data';
import { useState, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';
import { createBlockFromSubscription } from '../../utils';
import BlogrollAppenderResults from '../blogroll-appender-results';
import BlogrollAppenderSearch from '../blogroll-appender-search';

import './style.scss';

export default function BlogrollAppender( { subscriptions, clientId } ) {
	const [ isVisible, setIsVisible ] = useState( false );
	const [ popoverAnchor, setPopoverAnchor ] = useState();
	const [ searchInput, setSearchInput ] = useState( '' );
	const { insertBlock } = dispatch( 'core/block-editor' );
	const [ resultsz, setResultsz ] = useState( subscriptions ?? [] );
	const abortControllerRef = useRef();

	const fetchSiteDetails = async searchQuery => {
		if ( abortControllerRef.current ) {
			abortControllerRef.current.abort();
		}
		abortControllerRef.current =
			typeof AbortController === 'undefined' ? undefined : new AbortController();

		const siteDetails = await fetch(
			addQueryArgs(
				'https://public-api.wordpress.com/rest/v1.1/sites/' + encodeURIComponent( searchQuery ),
				{ force: 'wpcom' }
			)
		)
			.then( response => {
				return response.json();
			} )
			.then( data => {
				if ( data ) {
					setResultsz( [
						{
							id: data?.ID,
							description: data?.description,
							URL: data?.URL,
							site_icon: data?.site_icon,
							name: data?.name,
						},
					] );
				}
			} );

		return siteDetails;
	};

	const toggleVisible = () => {
		setIsVisible( state => ! state );
	};

	const onSelect = subscription => {
		insertBlock( createBlockFromSubscription( subscription ), undefined, clientId );
		setIsVisible( false );
	};

	useEffect( () => {
		const searchQuery = searchInput.toLowerCase().trim();
		if ( searchQuery.length > 0 ) {
			let newResults = [];
			const existInSubscriptions = subscriptions.filter( item => {
				const nameContainsSearch = item.name.toLowerCase().includes( searchQuery.toLowerCase() );
				const urlContainsSearch = item.URL.toLowerCase().includes( searchQuery.toLowerCase() );

				return nameContainsSearch || urlContainsSearch;
			} );

			newResults = existInSubscriptions;

			if ( searchQuery === 'agrullon95.wordpress.com' ) {
				fetchSiteDetails( searchQuery );
			} else {
				setResultsz( newResults );
			}
		} else {
			setResultsz( subscriptions );
		}
	}, [ searchInput, subscriptions ] );

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
							subscriptions={ resultsz }
							onSelect={ onSelect }
						/>
					</form>
				</Popover>
			) }
		</>
	);
}
