import { Button, Popover } from '@wordpress/components';
import { dispatch } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
import { debounce } from '../../../../shared/debounce';
import { createBlockFromSubscription } from '../../utils';
import BlogrollAppenderResults from '../blogroll-appender-results';
import BlogrollAppenderSearch from '../blogroll-appender-search';

import './style.scss';

export default function BlogrollAppender( { subscriptions, clientId } ) {
	const [ isVisible, setIsVisible ] = useState( false );
	const [ results, setResults ] = useState( [] );
	const [ popoverAnchor, setPopoverAnchor ] = useState();
	const [ searchInput, setSearchInput ] = useState( '' );
	const { insertBlock } = dispatch( 'core/block-editor' );

	const toggleVisible = () => {
		setIsVisible( state => ! state );
	};

	const onSelect = subscription => {
		insertBlock( createBlockFromSubscription( subscription ), undefined, clientId );
		setIsVisible( false );
	};

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(
		debounce( () => {
			const query = searchInput.toLowerCase();

			setResults(
				subscriptions.filter( item => {
					const nameContainsSearch = item.name.toLowerCase().includes( query.toLowerCase() );
					const urlContainsSearch = item.URL.toLowerCase().includes( query.toLowerCase() );

					return nameContainsSearch || urlContainsSearch;
				} )
			);
		}, 250 ),
		[ searchInput ]
	);

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
