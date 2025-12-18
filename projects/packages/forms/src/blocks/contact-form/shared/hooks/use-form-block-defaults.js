import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { INTEGRATIONS_STORE } from '../../../../store/integrations/index.ts';

/**
 * Apply default form block settings once per block instance when needed.
 *
 * Example: initialize integration flags from backend-filtered enabledByDefault
 * values for MailPoet, Salesforce, and Jetpack CRM when those flags are undefined.
 *
 * @param {object}   params               - Hook parameters.
 * @param {object}   params.attributes    - Block attributes
 * @param {Function} params.setAttributes - Setter for block attributes
 */
export default function useFormBlockDefaults( { attributes, setAttributes } ) {
	const integrations = useSelect( select => {
		const store = select( INTEGRATIONS_STORE );
		return store.getIntegrations() || [];
	}, [] );
	const isLoading = useSelect( select => select( INTEGRATIONS_STORE ).isIntegrationsLoading(), [] );

	useEffect( () => {
		if ( isLoading || ! Array.isArray( integrations ) ) {
			return;
		}

		// Enable form integrations by default based on backend filter.
		const find = id => integrations.find( i => i?.id === id );
		const crm = find( 'zero-bs-crm' );
		const mailpoet = find( 'mailpoet' );
		const salesforce = find( 'salesforce' );

		if ( typeof attributes?.jetpackCRM === 'undefined' && crm ) {
			setAttributes( { jetpackCRM: !! crm.enabledByDefault } );
		}

		if ( typeof attributes?.mailpoet?.enabledForForm === 'undefined' && mailpoet ) {
			setAttributes( {
				mailpoet: {
					...attributes.mailpoet,
					enabledForForm: !! mailpoet.enabledByDefault,
				},
			} );
		}

		if ( typeof attributes?.salesforceData?.sendToSalesforce === 'undefined' && salesforce ) {
			setAttributes( {
				salesforceData: {
					...attributes.salesforceData,
					sendToSalesforce: !! salesforce.enabledByDefault,
				},
			} );
		}
	}, [
		isLoading,
		integrations,
		attributes?.jetpackCRM,
		attributes.mailpoet,
		attributes.salesforceData,
		setAttributes,
	] );
}
