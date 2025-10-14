import {
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import useResponseNavigation from '../../hooks/use-response-navigation';
import ResponseActions from '../response-actions';
import ResponseNavigation from '../response-navigation';
import ResponseView from './index';

/**
 * Component wrapper for InboxResponse in DataViews modal
 * Renders response with navigation in modal header for mobile view
 * @param {object}       props            - The props object.
 * @param {FormResponse} props.response   - The response item.
 * @param {Function}     props.closeModal - Function to close the DataViews modal.
 * @return {import('react').JSX.Element} The DataViews component.
 */
const ResponseMobileView = ( { response, closeModal } ) => {
	const [ currentResponse, setCurrentResponse ] = useState( response );

	// Use the navigation hook
	const navigation = useResponseNavigation( {
		onChangeSelection: null,
		record: currentResponse,
		setRecord: setCurrentResponse,
	} );

	const { hasNext, hasPrevious, handleNext, handlePrevious } = navigation;

	// Action complete handler is a bit different on mobile view.
	// We don't close the modal if the response hasn't changed status (read/unread toggle)
	// and we don't change nor mess with the selection.
	const handleActionComplete = useCallback(
		actionedResponse => {
			if ( actionedResponse && actionedResponse.status === response.status ) {
				setCurrentResponse( actionedResponse );
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
					<ResponseActions response={ currentResponse } onActionComplete={ handleActionComplete } />
					<ResponseNavigation
						hasNext={ hasNext }
						hasPrevious={ hasPrevious }
						onNext={ handleNext }
						onPrevious={ handlePrevious }
						onClose={ closeModal }
					/>
				</HStack>
			</HStack>
			<ResponseView isLoading={ false } response={ currentResponse } />
		</div>
	);
};

export default ResponseMobileView;
