/**
 * External dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { useNavigate } from 'react-router';
/**
 * Internal dependencies
 */
import IntegrationsModal from '../../blocks/contact-form/components/jetpack-integrations-modal/index.tsx';
import { INTEGRATIONS_STORE } from '../../store/integrations/index.ts';
/**
 * Types
 */
import type { SelectIntegrations, IntegrationsDispatch } from '../../store/integrations/index.ts';
import type { Integration } from '../../types/index.ts';

const EMPTY_ARRAY: Integration[] = [];

const Integrations = () => {
	const navigate = useNavigate();
	const [ isOpen, setIsOpen ] = useState( false );
	const { integrations } = useSelect( ( select: SelectIntegrations ) => {
		const store = select( INTEGRATIONS_STORE );
		return {
			integrations: store.getIntegrations() ?? EMPTY_ARRAY,
		};
	}, [] ) as { integrations: Integration[] };
	const { refreshIntegrations } = useDispatch( INTEGRATIONS_STORE ) as IntegrationsDispatch;

	useEffect( () => {
		setIsOpen( true );
	}, [] );

	const handleClose = useCallback( () => {
		setIsOpen( false );
		navigate( '/responses' );
	}, [ navigate ] );

	return (
		<IntegrationsModal
			isOpen={ isOpen }
			onClose={ handleClose }
			attributes={ undefined }
			setAttributes={ undefined }
			integrationsData={ integrations }
			refreshIntegrations={ refreshIntegrations }
			context="dashboard"
		/>
	);
};

export default Integrations;
