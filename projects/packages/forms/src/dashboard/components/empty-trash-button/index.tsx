/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import apiFetch from '@wordpress/api-fetch';
import { Button, __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { trash } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
/**
 * Internal dependencies
 */
import { store as dashboardStore } from '../../store';

type CoreStore = typeof coreStore & {
	invalidateResolutionForStore: ( store: typeof dashboardStore ) => void;
};

/**
 * Renders a button to empty form responses.
 *
 * @return {JSX.Element} The empty trash button.
 */
const EmptyTrashButton = (): JSX.Element => {
	const [ isConfirmDialogOpen, setConfirmDialogOpen ] = useState( false );
	const [ isEmptying, setIsEmptying ] = useState( false );

	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const { invalidateResolutionForStore } = useDispatch( coreStore ) as unknown as CoreStore;

	const selectedResponsesCount = useSelect(
		select => select( dashboardStore ).getSelectedResponsesCount(),
		[]
	);

	const { isResolving: isTotalItemsResolving, totalItems } = useEntityRecords(
		'postType',
		'feedback',
		{
			status: 'trash',
		}
	);

	const isEmpty = ! isTotalItemsResolving && totalItems === 0;

	const openConfirmDialog = useCallback( () => setConfirmDialogOpen( true ), [] );
	const closeConfirmDialog = useCallback( () => setConfirmDialogOpen( false ), [] );

	const onConfirmEmptying = useCallback( async () => {
		if ( isEmptying || isEmpty ) {
			return;
		}

		closeConfirmDialog();
		setIsEmptying( true );

		jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_empty_trash_click' );

		apiFetch( {
			method: 'DELETE',
			path: `/wp/v2/feedback/trash`,
		} )
			.then( ( response: { deleted?: number } ) => {
				const deleted = response?.deleted ?? 0;
				const successMessage =
					deleted === 1
						? __( 'Response deleted permanently.', 'jetpack-forms' )
						: sprintf(
								/* translators: The number of responses. */
								_n(
									'%d response deleted permanently.',
									'%d responses deleted permanently.',
									deleted,
									'jetpack-forms'
								),
								deleted
						  );
				createSuccessNotice( successMessage, { type: 'snackbar', id: 'empty-trash' } );
			} )
			.catch( () => {
				createErrorNotice( __( 'Could not empty trash.', 'jetpack-forms' ), {
					type: 'snackbar',
					id: 'empty-trash-error',
				} );
			} )
			.finally( () => {
				setIsEmptying( false );
				invalidateResolutionForStore( dashboardStore );
			} );
	}, [
		closeConfirmDialog,
		createErrorNotice,
		createSuccessNotice,
		invalidateResolutionForStore,
		isEmpty,
		isEmptying,
	] );

	return (
		<>
			<Button
				__next40pxDefaultSize
				accessibleWhenDisabled
				className="jp-forms__button--large-green"
				disabled={ isEmpty || isEmptying }
				icon={ trash }
				isBusy={ isEmptying }
				label={ isEmpty ? __( 'Trash is already empty.', 'jetpack-forms' ) : '' }
				onClick={ openConfirmDialog }
				showTooltip={ isEmpty }
				variant="primary"
			>
				{ __( 'Empty trash', 'jetpack-forms' ) }
			</Button>
			<ConfirmDialog
				onCancel={ closeConfirmDialog }
				onConfirm={ onConfirmEmptying }
				isOpen={ isConfirmDialogOpen }
				confirmButtonText={ __( 'Delete', 'jetpack-forms' ) }
			>
				<h3>{ __( 'Delete forever', 'jetpack-forms' ) }</h3>
				<p>
					{ selectedResponsesCount > 0
						? sprintf(
								// translators: placeholder is a number of trash total
								_n(
									'%d response in trash will be deleted forever. This action cannot be undone.',
									'All %d responses in trash will be deleted forever. This action cannot be undone.',
									totalItems || 0,
									'jetpack-forms'
								),
								totalItems
						  )
						: __(
								'All responses in trash will be deleted forever. This action cannot be undone.',
								'jetpack-forms'
						  ) }
				</p>
			</ConfirmDialog>
		</>
	);
};

export default EmptyTrashButton;
