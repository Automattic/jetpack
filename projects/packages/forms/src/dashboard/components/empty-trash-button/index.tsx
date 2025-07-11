/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import apiFetch from '@wordpress/api-fetch';
import { Button, Modal } from '@wordpress/components';
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { dispatch } from '@wordpress/data';
import { useState, useCallback, createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { trash } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
/**
 * Internal dependencies
 */
import { store as dashboardStore } from '../../store';

import './style.scss';

type CoreStore = typeof coreStore & {
	invalidateResolutionForStore: ( store: typeof dashboardStore ) => void;
};

/**
 * Renders a button to empty form responses.
 *
 * @return {JSX.Element} The empty trash button.
 */
const EmptyTrashButton = (): JSX.Element => {
	const [ isOpen, setOpen ] = useState( false );
	const [ isLoading, setIsLoading ] = useState( false );

	const { createSuccessNotice, createErrorNotice } = dispatch( noticesStore );
	const { invalidateResolutionForStore } = dispatch( coreStore ) as unknown as CoreStore;

	const { totalItems } = useEntityRecords( 'postType', 'feedback', {
		status: 'trash',
	} );

	const isEmpty = totalItems === 0;

	const openModal = useCallback( () => setOpen( true ), [] );
	const closeModal = useCallback( () => setOpen( false ), [] );

	const onButtonClickHandler = useCallback( async () => {
		if ( isLoading || isEmpty ) {
			return;
		}

		setIsLoading( true );

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
				setIsLoading( false );
			} )
			.catch( () => {
				createErrorNotice( __( 'Could not empty trash.', 'jetpack-forms' ), {
					type: 'snackbar',
					id: 'empty-trash-error',
				} );
				setIsLoading( false );
			} )
			.finally( () => {
				invalidateResolutionForStore( dashboardStore );
				closeModal();
			} );
	}, [
		isLoading,
		isEmpty,
		invalidateResolutionForStore,
		createSuccessNotice,
		createErrorNotice,
		closeModal,
	] );

	return (
		<>
			<Button
				__next40pxDefaultSize
				accessibleWhenDisabled
				className="jp-forms__button--large-green"
				disabled={ isEmpty || isLoading }
				icon={ trash }
				isBusy={ isLoading }
				label={ isEmpty ? __( 'Trash is already empty.', 'jetpack-forms' ) : '' }
				onClick={ openModal }
				showTooltip={ isEmpty }
				variant="primary"
			>
				{ __( 'Empty trash', 'jetpack-forms' ) }
			</Button>
			{ isOpen && (
				<Modal
					title={ __( 'Confirm permanent deletion', 'jetpack-forms' ) }
					onRequestClose={ closeModal }
				>
					<p>
						{ createInterpolateElement(
							__(
								'Are you sure you want to empty the all responses in the trash? <strong>This action cannot be undone.</strong>',
								'jetpack-forms'
							),
							{
								strong: <strong />,
							}
						) }
					</p>
					<div className="jp-forms__empty-trash-modal-actions">
						<Button variant="secondary" onClick={ closeModal }>
							{ __( 'Cancel', 'jetpack-forms' ) }
						</Button>
						<Button
							variant="primary"
							isBusy={ isLoading }
							isDestructive
							onClick={ onButtonClickHandler }
						>
							{ __( 'Empty trash', 'jetpack-forms' ) }
						</Button>
					</div>
				</Modal>
			) }
		</>
	);
};

export default EmptyTrashButton;
