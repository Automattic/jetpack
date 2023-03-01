import {
	Button,
	__experimentalInputControl as InputControl, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
	SelectControl,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { find, includes, map } from 'lodash';
import Layout from '../components/layout';
import { STORE_NAME } from '../state';
import InboxList from './list';
import InboxResponse from './response';

import './style.scss';

const RESPONSES_FETCH_LIMIT = 5;

const Inbox = () => {
	const [ currentResponseId, setCurrentResponseId ] = useState( -1 );
	const [ searchText, setSearchText ] = useState( '' );
	const [ currentPage, setCurrentPage ] = useState( 1 );
	const [ searchTerm, setSearchTerm ] = useState( searchText );

	const [ loading, responses, total ] = useSelect(
		select => {
			const stateSelector = select( STORE_NAME );
			return [
				stateSelector.isFetchingResponses(),
				stateSelector.getResponses(
					searchTerm,
					RESPONSES_FETCH_LIMIT,
					( currentPage - 1 ) * RESPONSES_FETCH_LIMIT
				),
				stateSelector.getTotalResponses(),
			];
		},
		[ searchTerm, currentPage ]
	);

	useEffect( () => {
		if ( responses.length === 0 || includes( map( responses, 'id' ), currentResponseId ) ) {
			return;
		}

		setCurrentResponseId( responses[ 0 ].id );
	}, [ responses, currentResponseId ] );

	const handleSearch = useCallback(
		event => {
			event.preventDefault();
			setSearchTerm( searchText );
			setCurrentPage( 1 );
		},
		[ searchText ]
	);

	const numberOfResponses = sprintf(
		/* translators: %s: Number of responses. */
		_n( '%s response', '%s responses', total, 'jetpack-forms' ),
		total
	);

	return (
		<Layout title={ __( 'Responses', 'jetpack-forms' ) } subtitle={ numberOfResponses }>
			<div className="jp-forms__actions">
				<form className="jp-forms__actions-form">
					<SelectControl
						options={ [
							{ label: __( 'Bulk actions', 'jetpack-forms' ), value: '' },
							{ label: __( 'Trash', 'jetpack-forms' ), value: 'trash' },
							{ label: __( 'Move to spam', 'jetpack-forms' ), value: 'spam' },
						] }
					/>
					<Button variant="secondary">{ __( 'Apply', 'jetpack-forms' ) }</Button>
				</form>
				<form className="jp-forms__actions-form" onSubmit={ handleSearch }>
					<InputControl onChange={ setSearchText } value={ searchText } />
					<Button type="submit" variant="secondary">
						{ __( 'Search', 'jetpack-forms' ) }
					</Button>
				</form>
			</div>
			<div className="jp-forms__inbox-content">
				<div className="jp-forms__inbox-content-column">
					<InboxList
						currentResponseId={ currentResponseId }
						hasMore={ responses.length < total }
						loading={ loading }
						onSelectionChange={ setCurrentResponseId }
						responses={ responses }
						currentPage={ currentPage }
						setCurrentPage={ setCurrentPage }
						total={ total }
						pages={ Math.ceil( total / RESPONSES_FETCH_LIMIT ) }
					/>
				</div>

				<div className="jp-forms__inbox-content-column">
					<InboxResponse
						isLoading={ loading }
						response={ find( responses, { id: currentResponseId } ) }
					/>
				</div>
			</div>
		</Layout>
	);
};

export default Inbox;
