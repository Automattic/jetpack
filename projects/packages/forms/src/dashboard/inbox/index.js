/**
 * External dependencies
 */
import {
	TabPanel,
	Button,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import {
	createInterpolateElement,
	useCallback,
	useEffect,
	useState,
	useMemo,
} from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { useNavigate, useSearchParams } from 'react-router-dom';
/**
 * Internal dependencies
 */
import { config } from '../';
import Layout from '../components/layout';
import { STORE_NAME } from '../state';
import CheckForSpamButton from './check-for-spam-button';
import InboxView from './dataviews';
import ExportModal from './export-modal';
/**
 * Style dependencies
 */
import './style.scss';

const getTabTitle = ( title, totalItems ) => {
	return (
		<>
			{ title }
			<span className="jp-forms__inbox-tab-item-count">{ totalItems || 0 }</span>
		</>
	);
};

/**
 * Helper hook that returns the tab titles with the total items appended,
 * based on the current query.
 *
 * @return {object[]} The tab items.
 */
function useTabItems() {
	const currentQuery = useSelect( select => select( STORE_NAME ).getCurrentQuery(), [] );
	const queryBase = { ...currentQuery, per_page: 1, _fields: 'id' };
	const { isResolving: isLoadingInbox, totalItems: totalItemsInbox } = useEntityRecords(
		'postType',
		'feedback',
		{ ...queryBase, status: 'publish,draft' }
	);
	const { isResolving: isLoadingSpam, totalItems: totalItemsSpam } = useEntityRecords(
		'postType',
		'feedback',
		{ ...queryBase, status: 'spam' }
	);
	const { isResolving: isLoadingTrash, totalItems: totalItemsTrash } = useEntityRecords(
		'postType',
		'feedback',
		{ ...queryBase, status: 'trash' }
	);
	const isLoading = isLoadingInbox || isLoadingSpam || isLoadingTrash;
	return useMemo( () => {
		return [
			{
				name: 'inbox',
				title: getTabTitle( __( 'Inbox', 'jetpack-forms' ), totalItemsInbox ),
				className: 'jp-forms__inbox-tab-item',
				disabled: isLoading,
			},
			{
				name: 'spam',
				title: getTabTitle( __( 'Spam', 'jetpack-forms' ), totalItemsSpam ),
				className: 'jp-forms__inbox-tab-item',
				disabled: isLoading,
			},
			{
				name: 'trash',
				title: getTabTitle( _x( 'Trash', 'noun', 'jetpack-forms' ), totalItemsTrash ),
				className: 'jp-forms__inbox-tab-item',
				disabled: isLoading,
			},
		];
	}, [ isLoading, totalItemsInbox, totalItemsSpam, totalItemsTrash ] );
}

const Inbox = () => {
	const [ searchParams, setSearchParams ] = useSearchParams();
	const urlStatus = searchParams.get( 'status' );
	const [ showExportModal, setShowExportModal ] = useState( false );
	const navigate = useNavigate();
	const tabs = useTabItems();
	const userCanExport = useSelect(
		select => select( coreStore ).canUser( 'update', 'settings' ),
		[]
	);

	// If a user has no responses yet, redirect them to the landing page.
	useEffect( () => {
		if ( config( 'hasFeedback' ) ) {
			return;
		}
		navigate( '/landing' );
	}, [ navigate ] );

	const toggleExportModal = useCallback(
		() => setShowExportModal( ! showExportModal ),
		[ showExportModal, setShowExportModal ]
	);

	const title = <span className="title">{ __( 'Responses', 'jetpack-forms' ) }</span>;

	const subtitle = (
		<span className="subtitle">
			{ createInterpolateElement(
				__( 'Collect and manage responses from your audience. <a>Learn more</a>', 'jetpack-forms' ),
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
	);

	const onTabSelect = useCallback(
		newStatusValue => {
			setSearchParams( previouSearchParams => {
				const _serachParams = new URLSearchParams( previouSearchParams );
				_serachParams.set( 'status', newStatusValue );
				return _serachParams;
			} );
		},
		[ setSearchParams ]
	);
	return (
		<Layout className="jp-forms__inbox">
			<div className="jp-forms__layout-header">
				<HStack justify="space-between">
					<h2 className="jp-forms__layout-title">{ title }</h2>
					<HStack justify="flex-end">
						<CheckForSpamButton />
						{ userCanExport && (
							<Button className="export-button" variant="primary" onClick={ toggleExportModal }>
								{ __( 'Export', 'jetpack-forms' ) }
							</Button>
						) }
					</HStack>
				</HStack>
				<p className="jp-forms__header-subtext">{ subtitle }</p>
			</div>
			<TabPanel
				className="jp-forms__inbox-tabs"
				activeClass="active-tab"
				initialTabName={ [ 'inbox', 'spam', 'trash' ].includes( urlStatus ) ? urlStatus : 'inbox' }
				onSelect={ onTabSelect }
				tabs={ tabs }
			>
				{ () => <InboxView /> }
			</TabPanel>
			<ExportModal isVisible={ showExportModal } onClose={ toggleExportModal } />
		</Layout>
	);
};

export default Inbox;
