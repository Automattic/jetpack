import { Gridicon } from '@automattic/jetpack-components';
import {
	Button,
	__experimentalInputControl as InputControl, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
	SelectControl,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import { find, includes, map } from 'lodash';
import Layout from '../components/layout';
import { STORE_NAME } from '../state';
import InboxList from './list';
import InboxResponse from './response';
import './style.scss';

const RESPONSES_FETCH_LIMIT = 5;

const Inbox = () => {
	const [ currentResponseId, setCurrentResponseId ] = useState( -1 );
	const [ view, setView ] = useState( 'list' );

	const { invalidateResolution, setSearch } = useDispatch( STORE_NAME );

	const search = useSelect( select => select( STORE_NAME ).getSearch() );

	const [ searchText, setSearchText ] = useState( search );
	const [ currentPage, setCurrentPage ] = useState( 1 );

	const [ loading, responses, total ] = useSelect(
		select => {
			const stateSelector = select( STORE_NAME );
			return [
				stateSelector.isFetchingResponses(),
				stateSelector.getResponses(
					search,
					RESPONSES_FETCH_LIMIT,
					( currentPage - 1 ) * RESPONSES_FETCH_LIMIT
				),
				stateSelector.getTotalResponses(),
			];
		},
		[ search, currentPage ]
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
			invalidateResolution( 'getResponses', [ searchText, RESPONSES_FETCH_LIMIT, 0 ] );
			setCurrentPage( 1 );
			setSearch( searchText );
		},
		[ searchText, setSearch, setCurrentPage, invalidateResolution ]
	);

	const handlePageChange = useCallback(
		page => {
			invalidateResolution( 'getResponses', [
				search,
				RESPONSES_FETCH_LIMIT,
				( page - 1 ) * RESPONSES_FETCH_LIMIT,
			] );
			setCurrentPage( page );
		},
		[ search, setCurrentPage, invalidateResolution ]
	);

	const selectResponse = useCallback( id => {
		setCurrentResponseId( id );
		setView( 'response' );
	}, [] );

	const handleGoBack = useCallback( event => {
		event.preventDefault();
		setView( 'list' );
	}, [] );

	const classes = classnames( 'jp-forms__inbox', {
		'is-response-view': view === 'response',
	} );

	const title = (
		<>
			<span className="title">{ __( 'Responses', 'jetpack-forms' ) }</span>
			{ /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */ }
			<a className="back-button" onClick={ handleGoBack }>
				<Gridicon icon="arrow-left" />
				{ __( 'View all responses', 'jetpack-forms' ) }
			</a>
		</>
	);

	return (
		<Layout title={ title } className={ classes }>
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
						loading={ loading }
						setCurrentResponseId={ selectResponse }
						responses={ responses }
						currentPage={ currentPage }
						setCurrentPage={ handlePageChange }
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
