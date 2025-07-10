/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import apiFetch from '@wordpress/api-fetch';
import { Button } from '@wordpress/components';
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { dispatch } from '@wordpress/data';
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
	const [ isLoading, setIsLoading ] = useState( false );
	const { createSuccessNotice, createErrorNotice } = dispatch( noticesStore );
	const { invalidateResolutionForStore } = dispatch( coreStore ) as unknown as CoreStore;

	const { totalItems } = useEntityRecords( 'postType', 'feedback', {
		status: 'trash',
	} );

	const isEmpty = totalItems === 0;

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
			} );
	}, [ isLoading, isEmpty, invalidateResolutionForStore, createSuccessNotice, createErrorNotice ] );

	return (
		<Button
			__next40pxDefaultSize
			accessibleWhenDisabled
			className="jp-forms__button--large-green"
			disabled={ isEmpty || isLoading }
			icon={ trash }
			isBusy={ isLoading }
			label={ isEmpty ? __( 'Trash is already empty.', 'jetpack-forms' ) : '' }
			onClick={ onButtonClickHandler }
			showTooltip={ isEmpty }
			variant="primary"
		>
			{ __( 'Empty trash', 'jetpack-forms' ) }
		</Button>
	);
};

export default EmptyTrashButton;
