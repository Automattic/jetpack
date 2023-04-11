import { TabPanel, Icon } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { dateI18n } from '@wordpress/date';
import { useCallback, useEffect, useMemo, useState, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { arrowLeft } from '@wordpress/icons';
import classnames from 'classnames';
import { find, includes, map } from 'lodash';
import { config } from '../';
import DropdownFilter from '../components/dropdown-filter';
import Layout from '../components/layout';
import SearchForm from '../components/search-form';
import { STORE_NAME } from '../state';
import BulkActionsMenu from './bulk-actions-menu';
import ExportModal from './export-modal';
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
	const stickySentinel = useRef();
	const [ currentResponseId, setCurrentResponseId ] = useState( -1 );
	const [ showExportModal, setShowExportModal ] = useState( false );
	const [ view, setView ] = useState( 'list' );
	const [ isSticky, setSticky ] = useState( false );

	const {
		fetchResponses,
		setCurrentPage,
		setMonthQuery,
		setSearchQuery,
		setSourceQuery,
		setStatusQuery,
		selectResponses,
	} = useDispatch( STORE_NAME );
	const [
		currentPage,
		monthFilter,
		sourceFilter,
		loading,
		query,
		responses,
		selectedResponses,
		total,
	] = useSelect(
		select => [
			select( STORE_NAME ).getCurrentPage(),
			select( STORE_NAME ).getMonthFilter(),
			select( STORE_NAME ).getSourceFilter(),
			select( STORE_NAME ).isFetchingResponses(),
			select( STORE_NAME ).getResponsesQuery(),
			select( STORE_NAME ).getResponses(),
			select( STORE_NAME ).getSelectedResponseIds(),
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

	useEffect( () => {
		const stickySentinelRef = stickySentinel.current;

		if ( ! stickySentinelRef ) {
			return;
		}

		const observer = new IntersectionObserver(
			( [ sentinel ] ) => {
				setSticky( ! sentinel.isIntersecting && ! loading );
			},
			{
				rootMargin: '-177px 0px 0px 0px',
				threshold: 0,
			}
		);

		observer.observe( stickySentinelRef );

		return () => {
			observer.unobserve( stickySentinelRef );
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ stickySentinel.current, loading ] );

	const selectResponse = useCallback( id => {
		setCurrentResponseId( id );
		setView( 'response' );
	}, [] );

	const handleGoBack = useCallback( event => {
		event.preventDefault();
		setView( 'list' );
	}, [] );

	const toggleExportModal = useCallback(
		() => setShowExportModal( ! showExportModal ),
		[ showExportModal, setShowExportModal ]
	);

	const monthList = useMemo( () => {
		const list = map( monthFilter, item => {
			const date = new Date();
			date.setDate( 1 );
			date.setMonth( item.month - 1 );

			return {
				label: `${ dateI18n( 'F', date ) } ${ item.year }`,
				value: `${ item.year }${ String( item.month ).padStart( 2, '0' ) }`,
			};
		} );

		return [
			{
				label: __( 'All dates', 'jetpack-forms' ),
				value: null,
			},
			...list,
		];
	}, [ monthFilter ] );

	const sourceList = useMemo( () => {
		const list = map( sourceFilter, item => ( {
			label: item.title,
			value: item.id,
		} ) );

		return [
			{
				label: __( 'All sources', 'jetpack-forms' ),
				value: null,
			},
			...list,
		];
	}, [ sourceFilter ] );

	const showBulkActionsMenu = !! selectedResponses.length && ! loading;

	const classes = classnames( 'jp-forms__inbox', {
		'is-response-view': view === 'response',
	} );

	const title = (
		<>
			<span className="title">
				{ config( 'isWpcom' )
					? __( 'Jetpack Forms', 'jetpack-forms' )
					: __( 'Responses', 'jetpack-forms' ) }
			</span>
			{ config( 'isWpcom' ) && (
				<span className="subtitle">
					{ __( 'Collect and manage responses from your audience.', 'jetpack-forms' ) }
				</span>
			) }
			{ /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */ }
			<a className="back-button" onClick={ handleGoBack }>
				<Icon icon={ arrowLeft } />
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
							{ ! showBulkActionsMenu && (
								<>
									<SearchForm
										onSearch={ setSearchQuery }
										initialValue={ query.search }
										loading={ loading }
									/>
									<DropdownFilter
										options={ monthList }
										onChange={ setMonthQuery }
										value={ query.month }
									/>
									<DropdownFilter
										options={ sourceList }
										onChange={ setSourceQuery }
										value={ query.parent_id }
									/>
								</>
							) }
							{ showBulkActionsMenu && (
								<BulkActionsMenu
									currentView={ query.status }
									selectedResponses={ selectedResponses }
									setSelectedResponses={ selectResponses }
								/>
							) }

							<button className="button button-primary export-button" onClick={ toggleExportModal }>
								{ __( 'Export', 'jetpack-forms' ) }
							</button>
						</div>
						<div className="jp-forms__inbox-content">
							<div className="jp-forms__inbox-content-column">
								<div className="jp-forms__inbox-sticky-sentinel" ref={ stickySentinel } />
								{ ! loading && isSticky && <div className="jp-forms__inbox-sticky-mark" /> }
								<InboxList
									currentPage={ currentPage }
									currentResponseId={ currentResponseId }
									loading={ loading }
									pages={ Math.ceil( total / RESPONSES_FETCH_LIMIT ) }
									responses={ responses }
									selectedResponses={ selectedResponses }
									setCurrentPage={ setCurrentPage }
									setCurrentResponseId={ selectResponse }
									setSelectedResponses={ selectResponses }
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

			<ExportModal isVisible={ showExportModal } onClose={ toggleExportModal } />
		</Layout>
	);
};

export default Inbox;
