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

const RESPONSES_FETCH_LIMIT = 50;

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

	const { fetchResponses, setCurrentPage, setSearchQuery, setStatusQuery } =
		useDispatch( STORE_NAME );
	const [ currentPage, loading, responses, query, total ] = useSelect(
		select => [
			select( STORE_NAME ).getCurrentPage(),
			select( STORE_NAME ).isFetchingResponses(),
			select( STORE_NAME ).getResponses(),
			select( STORE_NAME ).getResponsesQuery(),
			select( STORE_NAME ).getTotalResponses(),
		],
		[]
	);

	useEffect( () => {
		fetchResponses( {
			limit: RESPONSES_FETCH_LIMIT,
			offset: ( currentPage - 1 ) * RESPONSES_FETCH_LIMIT,
			...query,
		} );
	}, [ currentPage, fetchResponses, query ] );

	useEffect( () => {
		if ( responses.length === 0 || includes( map( responses, 'id' ), currentResponseId ) ) {
			return;
		}

		setCurrentResponseId( responses[ 0 ].id );
	}, [ responses, currentResponseId ] );

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
			<TabPanel
				className="jp-forms__inbox-tabs"
				activeClass="active-tab"
				onSelect={ setStatusQuery }
				tabs={ TABS }
			>
				{ () => (
					<>
						<div className="jp-forms__inbox-actions">
							<SearchForm
								onSearch={ setSearchQuery }
								initialValue={ query.search }
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
									setCurrentPage={ setCurrentPage }
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
