import { Gridicon } from '@automattic/jetpack-components';
import { TabPanel } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import { find, includes, map } from 'lodash';
import DropdownFilter from '../components/dropdown-filter';
import Layout from '../components/layout';
import SearchForm from '../components/search-form';
import { STORE_NAME } from '../state';
import InboxList from './list';
import InboxResponse from './response';
import './style.scss';

const RESPONSES_FETCH_LIMIT = 10;

const TABS = [
	{
		name: 'inbox',
		title: 'Inbox',
		className: 'jp-forms__inbox-tab-item',
	},
	{
		name: 'spam',
		title: 'Spam',
		className: 'jp-forms__inbox-tab-item',
	},
	{
		name: 'trash',
		title: 'Trash',
		className: 'jp-forms__inbox-tab-item',
	},
];

const Inbox = () => {
	const [ currentResponseId, setCurrentResponseId ] = useState( -1 );
	const [ view, setView ] = useState( 'list' );
	const [ responseStatus, setResponseStatus ] = useState( 'inbox' );

	const { invalidateResolution, setSearchQuery } = useDispatch( STORE_NAME );

	const searchQuery = useSelect( select => select( STORE_NAME ).getSearchQuery() );

	const [ currentPage, setCurrentPage ] = useState( 1 );

	const [ loading, responses, total ] = useSelect(
		select => {
			const stateSelector = select( STORE_NAME );
			return [
				stateSelector.isFetchingResponses(),
				stateSelector.getResponses(
					searchQuery,
					responseStatus,
					RESPONSES_FETCH_LIMIT,
					( currentPage - 1 ) * RESPONSES_FETCH_LIMIT
				),
				stateSelector.getTotalResponses(),
			];
		},
		[ searchQuery, responseStatus, currentPage ]
	);

	useEffect( () => {
		if ( responses.length === 0 || includes( map( responses, 'id' ), currentResponseId ) ) {
			return;
		}

		setCurrentResponseId( responses[ 0 ].id );
	}, [ responses, currentResponseId ] );

	const handleSearch = useCallback(
		searchTerm => {
			invalidateResolution( 'getResponses', [
				searchTerm,
				responseStatus,
				RESPONSES_FETCH_LIMIT,
				0,
			] );
			setCurrentPage( 1 );
			setSearchQuery( searchTerm );
		},
		[ setSearchQuery, setCurrentPage, responseStatus, invalidateResolution ]
	);

	const handlePageChange = useCallback(
		page => {
			invalidateResolution( 'getResponses', [
				searchQuery,
				responseStatus,
				RESPONSES_FETCH_LIMIT,
				( page - 1 ) * RESPONSES_FETCH_LIMIT,
			] );
			setCurrentPage( page );
		},
		[ searchQuery, responseStatus, setCurrentPage, invalidateResolution ]
	);

	const selectResponse = useCallback( id => {
		setCurrentResponseId( id );
		setView( 'response' );
	}, [] );

	const handleGoBack = useCallback( event => {
		event.preventDefault();
		setView( 'list' );
	}, [] );

	const handleTabChange = useCallback( tabName => {
		setResponseStatus( tabName );
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
			<TabPanel
				className="jp-forms__inbox-tabs"
				activeClass="active-tab"
				onSelect={ handleTabChange }
				tabs={ TABS }
			>
				{ () => (
					<>
						<div className="jp-forms__inbox-actions">
							<SearchForm
								onSearch={ handleSearch }
								initialValue={ searchQuery }
								loading={ loading }
							/>
							<DropdownFilter
								options={ [
									{
										label: __( 'All dates', 'jetpack-forms' ),
										value: null,
									},
									{ value: 12, label: 'December 2023' },
									{ value: 1, label: 'January 2023' },
									{ value: 2, label: 'February 2023' },
									{ value: 3, label: 'March 2023' },
								] }
							/>
							<DropdownFilter
								options={ [
									{
										label: __( 'All sources', 'jetpack-forms' ),
										value: null,
									},
									{ value: 1, label: 'Division Meetup' },
									{ value: 2, label: 'RSVP Form' },
									{ value: 3, label: 'Contact Form' },
								] }
							/>
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
					</>
				) }
			</TabPanel>
		</Layout>
	);
};

export default Inbox;
