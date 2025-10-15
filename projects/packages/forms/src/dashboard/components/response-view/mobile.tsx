import {
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { FormResponse } from '../../../types';
import useResponseNavigation from '../../hooks/use-response-navigation';
import ResponseActions from '../response-actions';
import ResponseNavigation from '../response-navigation';
import { ResponseViewBody } from './index';

/**
 * Component wrapper for InboxResponse in DataViews modal
 * Renders response with navigation in modal header for mobile view
 * @param {object}       props            - The props object.
 * @param {FormResponse} props.response   - The response item.
 * @param {Function}     props.closeModal - Function to close the DataViews modal.
 * @return {import('react').JSX.Element} The DataViews component.
 */
const ResponseMobileView = ( { response, closeModal } ) => {
	const [ currentResponseId, setCurrentResponseId ] = useState( response.id );

	const responseRecord = useSelect(
		select =>
			select( coreStore ).getEditedEntityRecord(
				'postType',
				'feedback',
				currentResponseId
			) as unknown as FormResponse,
		[ currentResponseId ]
	);
	// Use the navigation hook
	const navigation = useResponseNavigation( {
		onChangeSelection: null,
		record: responseRecord,
		setRecord: record => setCurrentResponseId( record.id ),
	} );

	const { hasNext, hasPrevious, handleNext, handlePrevious } = navigation;

	// Action complete handler is a bit different on mobile view.
	// We don't close the modal if the response hasn't changed status (read/unread toggle)
	// and we don't change nor mess with the selection.
	const handleActionComplete = useCallback(
		actionedResponse => {
			if ( actionedResponse && actionedResponse.status === response.status ) {
				return;
			}
			closeModal?.();
		},
		[ closeModal, response ]
	);

	return (
		<div className="jp-forms__inbox__response-mobile">
			<HStack
				spacing="2"
				justify="space-between"
				className="jp-forms__inbox__response-mobile__header"
			>
				<h1 className="jp-forms__inbox__response-mobile__header-heading">
					{ __( 'Response', 'jetpack-forms' ) }
				</h1>
				<HStack
					spacing="2"
					justify="space-between"
					className="jp-forms__inbox__response-mobile__header-actions"
				>
					<ResponseActions response={ responseRecord } onActionComplete={ handleActionComplete } />
					<ResponseNavigation
						hasNext={ hasNext }
						hasPrevious={ hasPrevious }
						onNext={ handleNext }
						onPrevious={ handlePrevious }
						onClose={ closeModal }
					/>
				</HStack>
			</HStack>
			<ResponseViewBody isLoading={ false } response={ responseRecord } />
		</div>
	);
};

export default ResponseMobileView;
