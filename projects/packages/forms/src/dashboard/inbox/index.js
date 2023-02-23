import {
	Button,
	__experimentalInputControl as InputControl, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
	SelectControl,
} from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { find, includes, map } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../components/layout';
import { fetchResponses } from '../state/actions';
import { getResponses, getTotalResponses, isFetchingResponses } from '../state/selectors';
import InboxList from './list';
import InboxResponse from './response';

import './style.scss';

const RESPONSES_PER_PAGE = 10;

const Inbox = () => {
	const [ currentResponseId, setCurrentResponseId ] = useState( -1 );
	// const [ showResponseView, setShowResponseView ] = useState( false );
	const [ searchText, setSearchText ] = useState( '' );

	const dispatch = useDispatch();

	const [ loading, responses, total ] = useSelector( state => {
		return [ isFetchingResponses( state ), getResponses( state ), getTotalResponses( state ) ];
	} );

	useEffect( () => {
		fetchResponses( {}, RESPONSES_PER_PAGE )( dispatch );
	}, [ dispatch ] );

	useEffect( () => {
		if ( responses.length === 0 || includes( map( responses, 'id' ), currentResponseId ) ) {
			return;
		}

		setCurrentResponseId( responses[ 0 ].id );
	}, [ responses, currentResponseId ] );

	const handleLoadMore = useCallback( () => {
		fetchResponses( { search: searchText }, RESPONSES_PER_PAGE, responses.length )( dispatch );
	}, [ searchText, responses, dispatch ] );

	const handleSearch = useCallback(
		event => {
			event.preventDefault();
			fetchResponses( { search: searchText }, RESPONSES_PER_PAGE )( dispatch );
		},
		[ searchText, dispatch ]
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
						onLoadMore={ handleLoadMore }
						onSelectionChange={ setCurrentResponseId }
						responses={ responses }
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
