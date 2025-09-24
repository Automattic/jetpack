/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useBreakpointMatch } from '@automattic/jetpack-components';
import apiFetch from '@wordpress/api-fetch';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useState, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { store as dashboardStore } from '../store';

type ExportData = {
	selected: number[];
	post: string;
	search: string;
	status: string;
	before?: string;
	after?: string;
};

type ExportResponse = {
	download_url: string;
	count: number;
};

type ExportHookReturn = {
	showExportModal: boolean;
	openModal: () => void;
	closeModal: () => void;
	autoConnectGdrive: boolean;
	userCanExport: boolean;
	onExport: () => Promise< ExportResponse >;
	selectedResponsesCount: number;
	currentStatus: string;
	exportLabel: string;
};

/**
 * Hook to handle the export of form responses.
 *
 * @return {ExportHookReturn} The export modal state and actions.
 */
export default function useExportResponses(): ExportHookReturn {
	const [ isSm ] = useBreakpointMatch( 'sm' );
	const [ showExportModal, setShowExportModal ] = useState( false );
	const closeModal = useCallback( () => setShowExportModal( false ), [ setShowExportModal ] );
	const [ autoConnectGdrive, setAutoConnectGdrive ] = useState( false );
	const { selectedResponsesCount, currentStatus } = useSelect(
		select => ( {
			selectedResponsesCount: select( dashboardStore ).getSelectedResponsesCount(),
			currentStatus: select( dashboardStore ).getCurrentStatus(),
		} ),
		[]
	);
	const isSpam = currentStatus.includes( 'spam' );
	const isTrash = currentStatus.includes( 'trash' );

	let statusLabel: string = __( 'Export', 'jetpack-forms' );

	if ( isSpam ) {
		statusLabel = __( 'Export spam', 'jetpack-forms' );
	} else if ( isTrash ) {
		statusLabel = __( 'Export trash', 'jetpack-forms' );
	}

	const exportLabel =
		selectedResponsesCount > 0 ? `${ statusLabel } (${ selectedResponsesCount })` : statusLabel;

	const openModal = useCallback( () => {
		setShowExportModal( true );

		jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_export_responses_modal_open', {
			viewport: isSm ? 'mobile' : 'desktop',
		} );
	}, [ isSm ] );

	const userCanExport = useSelect(
		select => select( coreStore ).canUser( 'update', 'settings' ),
		[]
	);

	const { selected, currentQuery } = useSelect( select => {
		const { getSelectedResponsesFromCurrentDataset, getCurrentQuery } = select( dashboardStore );

		return { selected: getSelectedResponsesFromCurrentDataset(), currentQuery: getCurrentQuery() };
	}, [] );

	const onExport = useCallback( async (): Promise< ExportResponse > => {
		const exportData: ExportData = {
			selected: selected.map( Number ),
			post: currentQuery.parent ? String( currentQuery.parent ) : 'all',
			search: currentQuery.search || '',
			status: currentQuery.status || 'publish',
		};

		if ( currentQuery.before ) {
			exportData.before = currentQuery.before;
		}
		if ( currentQuery.after ) {
			exportData.after = currentQuery.after;
		}

		const response = await apiFetch< ExportResponse >( {
			path: '/wp/v2/feedback/export',
			method: 'POST',
			data: exportData,
		} );

		if ( response && response.download_url ) {
			// Trigger download by navigating to the URL
			window.location.href = response.download_url;
			return response;
		}
		throw new Error( 'Invalid response: missing download URL' );
	}, [ currentQuery, selected ] );

	useEffect( () => {
		const url = new URL( window.location.href );

		if ( url.searchParams.get( 'connect-gdrive' ) === 'true' ) {
			setAutoConnectGdrive( true );
			openModal();

			// Update the URL to remove the query param
			url.searchParams.delete( 'connect-gdrive' );
			window.history.replaceState( {}, '', url );
		}
	}, [ openModal ] );

	return {
		showExportModal,
		openModal,
		closeModal,
		autoConnectGdrive,
		userCanExport,
		onExport,
		selectedResponsesCount,
		currentStatus,
		exportLabel,
	};
}
