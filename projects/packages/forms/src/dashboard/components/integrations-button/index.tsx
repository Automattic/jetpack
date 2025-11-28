/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import IntegrationsModal from '../../../blocks/contact-form/components/jetpack-integrations-modal/index.tsx';
import { INTEGRATIONS_STORE } from '../../../store/integrations/index.ts';
/**
 * Types
 */
import type {
	SelectIntegrations,
	IntegrationsDispatch,
} from '../../../store/integrations/index.ts';
import type { Integration } from '../../../types/index.ts';

const EMPTY_ARRAY: Integration[] = [];

/**
 * Renders a button to open the integrations modal.
 *
 * @return {JSX.Element} The button to open integrations.
 */
export default function IntegrationsButton(): JSX.Element {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const { integrations } = useSelect( ( select: SelectIntegrations ) => {
		const store = select( INTEGRATIONS_STORE );
		return {
			integrations: store.getIntegrations() ?? EMPTY_ARRAY,
		};
	}, [] ) as { integrations: Integration[] };
	const { refreshIntegrations } = useDispatch( INTEGRATIONS_STORE ) as IntegrationsDispatch;

	const onButtonClickHandler = useCallback( () => {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_integrations_button_click', {
			origin: 'dashboard',
		} );
		setIsModalOpen( true );
	}, [] );

	const handleCloseModal = useCallback( () => {
		setIsModalOpen( false );
	}, [] );

	return (
		<>
			<Button size="compact" variant="secondary" onClick={ onButtonClickHandler }>
				{ __( 'Manage integrations', 'jetpack-forms' ) }
			</Button>
			{ isModalOpen && (
				<IntegrationsModal
					isOpen={ isModalOpen }
					onClose={ handleCloseModal }
					attributes={ undefined }
					setAttributes={ undefined }
					integrationsData={ integrations }
					refreshIntegrations={ refreshIntegrations }
					context="dashboard"
				/>
			) }
		</>
	);
}
