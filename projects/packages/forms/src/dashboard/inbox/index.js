/**
 * External dependencies
 */
import { TabPanel, Icon } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { dateI18n } from '@wordpress/date';
import {
	createInterpolateElement,
	useCallback,
	useEffect,
	useMemo,
	useState,
	useRef,
} from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { arrowLeft } from '@wordpress/icons';
import clsx from 'clsx';
import { find, findIndex, includes, isEqual, join, keys, map, pick } from 'lodash';
import { useNavigate } from 'react-router-dom';
/**
 * Internal dependencies
 */
import { config } from '../';
import DropdownFilter from '../components/dropdown-filter';
import Layout from '../components/layout';
import SearchForm from '../components/search-form';
import { STORE_NAME } from '../state';
import BulkActionsMenu from './bulk-actions-menu';
import { RESPONSES_FETCH_LIMIT } from './constants';
import ExportModal from './export-modal';
import InboxList from './list';
import InboxResponse from './response';
import { useFeedbackQuery } from './use-feedback-query';
import { isWpcom } from './util';
/**
 * Style dependencies
 */
import './style.scss';

const TABS = [
	{
		name: 'inbox',
		title: __( 'Inbox', 'jetpack-forms' ),
		className: 'jp-forms__inbox-tab-item',
	},
	{
		name: 'spam',
		title: __( 'Spam', 'jetpack-forms' ),
		className: 'jp-forms__inbox-tab-item',
	},
	{
		name: 'trash',
		title: _x( 'Trash', 'noun', 'jetpack-forms' ),
		className: 'jp-forms__inbox-tab-item',
	},
];

const Inbox = () => {
	const stickySentinel = useRef();
	const [ responseAnimationDirection, setResponseAnimationDirection ] = useState( 1 );
	const [ showExportModal, setShowExportModal ] = useState( false );
	const [ isSticky, setSticky ] = useState( false );
	const navigate = useNavigate();
	const { fetchResponses, selectResponses } = useDispatch( STORE_NAME );
	const [
		currentQuery,
		monthFilter,
		sourceFilter,
		loading,
		responses,
		selectedResponses,
		tabTotals,
		total,
	] = useSelect(
		select => [
			select( STORE_NAME ).getQuery(),
			select( STORE_NAME ).getMonthFilter(),
			select( STORE_NAME ).getSourceFilter(),
			select( STORE_NAME ).isFetchingResponses(),
			select( STORE_NAME ).getResponses(),
			select( STORE_NAME ).getSelectedResponseIds(),
			select( STORE_NAME ).getTabTotals(),
			select( STORE_NAME ).getTotalResponses(),
		],
		[]
	);

	const userCanExport = useSelect( select => {
		const { canUser } = select( coreStore );
		// Using settings capability as a proxy for export capability, since there is no export route in the API yet.
		return canUser( 'update', 'settings' );
	} );

	const {
		currentPage,
		currentResponseId,
		setCurrentPage,
		setCurrentResponseId: setActiveResponse,
		setMonthQuery,
		setSearchQuery,
		setSourceQuery,
		setStatusQuery,
		query,
	} = useFeedbackQuery();

	useEffect( () => {
		if ( config( 'hasFeedback' ) ) {
			return;
		}

		navigate( '/landing' );
	}, [ navigate ] );

	useEffect( () => {
		fetchResponses( {
			limit: RESPONSES_FETCH_LIMIT,
			offset: ( currentPage - 1 ) * RESPONSES_FETCH_LIMIT,
			...query,
		} );
	}, [ currentPage, fetchResponses, query ] );

	useEffect( () => {
		if (
			! currentResponseId ||
			loading ||
			! isEqual( pick( currentQuery, keys( query ) ), query ) ||
			includes( map( responses, 'id' ), currentResponseId )
		) {
			return;
		}

		// Redirect to the list view on mobile when the response ID is invalid
		setActiveResponse( 0 );
	}, [ currentQuery, currentResponseId, loading, responses, setActiveResponse, query ] );

	const activeResponse = useMemo( () => {
		if ( responses.length && ! includes( map( responses, 'id' ), currentResponseId ) ) {
			return responses[ 0 ].id;
		}

		return currentResponseId;
	}, [ currentResponseId, responses ] );

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

	const selectResponse = useCallback(
		id => {
			setActiveResponse( id );
			setResponseAnimationDirection(
				findIndex( responses, { id } ) - findIndex( responses, { id: activeResponse } )
			);
		},
		[ activeResponse, responses, setActiveResponse ]
	);

	const handleGoBack = useCallback(
		event => {
			event.preventDefault();
			setActiveResponse( 0 );
		},
		[ setActiveResponse ]
	);

	const toggleExportModal = useCallback(
		() => setShowExportModal( ! showExportModal ),
		[ showExportModal, setShowExportModal ]
	);

	const tabs = useMemo(
		() =>
			TABS.map( ( { title, ...tab } ) => ( {
				...tab,
				title: (
					<>
						{ title }
						{ tabTotals && (
							<span className="jp-forms__inbox-tab-item-count">{ tabTotals[ tab.name ] || 0 }</span>
						) }
					</>
				),
				disabled: loading,
			} ) ),
		[ loading, tabTotals ]
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
			value: `${ item.id }`,
		} ) );

		return [
			{
				label: __( 'All sources', 'jetpack-forms' ),
				value: null,
			},
			...list,
		];
	}, [ sourceFilter ] );

	const listKey = useMemo( () => {
		return join(
			map( pick( currentQuery, keys( query ) ), ( value, key ) => `${ key }-${ value }` ),
			'-'
		);
	}, [ currentQuery, query ] );

	const showBulkActionsMenu = !! selectedResponses.length && ! loading;

	const classes = clsx( 'jp-forms__inbox', {
		'is-response-view': !! currentResponseId,
		'is-response-animation-reverted': responseAnimationDirection < 0,
	} );

	const title = (
		<>
			<span className="title">
				{ isWpcom() ? __( 'Jetpack Forms', 'jetpack-forms' ) : __( 'Responses', 'jetpack-forms' ) }
			</span>
			{ isWpcom() && (
				<span className="subtitle">
					{ createInterpolateElement(
						__(
							'Collect and manage responses from your audience. <a>Learn more</a>',
							'jetpack-forms'
						),
						{
							a: (
								<a
									href="https://jetpack.com/support/jetpack-blocks/contact-form/"
									rel="noreferrer noopener"
									target="_blank"
								/>
							),
						}
					) }
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
				initialTabName={ query.status }
				onSelect={ setStatusQuery }
				tabs={ tabs }
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

							{ userCanExport && (
								<button
									className="button button-primary export-button"
									onClick={ toggleExportModal }
								>
									{ __( 'Export', 'jetpack-forms' ) }
								</button>
							) }
						</div>
						<div className="jp-forms__inbox-content">
							<div className="jp-forms__inbox-content-column">
								<div className="jp-forms__inbox-sticky-sentinel" ref={ stickySentinel } />
								{ ! loading && isSticky && <div className="jp-forms__inbox-sticky-mark" /> }
								<InboxList
									key={ listKey }
									currentPage={ currentPage }
									currentResponseId={ activeResponse }
									currentTab={ query.status }
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
									response={ find( responses, { id: activeResponse } ) }
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
