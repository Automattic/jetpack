import { useEffect } from '@wordpress/element';
import { useIntegrationsStatus } from '../../components/jetpack-integrations-modal/hooks/use-integrations-status';

/**
 * Allows us to apply default form block settings, if needed,
 * when form block is created.
 *
 * Example: We first created to this apply enabledByDefault settings for
 * specific form integrations that developers can filter on the backend.
 *
 * @param {object}   params               - Hook parameters.
 * @param {object}   params.attributes    - Block attributes
 * @param {Function} params.setAttributes - Setter for block attributes
 */
export default function useFormDefaults( { attributes, setAttributes } ) {
	const { integrations, isLoading } = useIntegrationsStatus();

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
