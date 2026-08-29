import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
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
	const { __unstableMarkNextChangeAsNotPersistent } = useDispatch( blockEditorStore );

	useEffect( () => {
		if ( isLoading || ! Array.isArray( integrations ) ) {
			return;
		}

		// Enable form integrations by default based on backend filter.
		const find = id => integrations.find( i => i?.id === id );
		const crm = find( 'zero-bs-crm' );
		const mailpoet = find( 'mailpoet' );
		const salesforce = find( 'salesforce' );

		/*
		 * Collect every missing flag into a single update. One update means one
		 * block-editor action, which is what lets the
		 * __unstableMarkNextChangeAsNotPersistent() call below cover all of them.
		 */
		const defaults = {};

		if ( crm && typeof attributes?.jetpackCRM === 'undefined' ) {
			defaults.jetpackCRM = !! crm.enabledByDefault;
		}

		if ( mailpoet && typeof attributes?.mailpoet?.enabledForForm === 'undefined' ) {
			defaults.mailpoet = {
				...attributes?.mailpoet,
				enabledForForm: !! mailpoet.enabledByDefault,
			};
		}

		if ( salesforce && typeof attributes?.salesforceData?.sendToSalesforce === 'undefined' ) {
			defaults.salesforceData = {
				...attributes?.salesforceData,
				sendToSalesforce: !! salesforce.enabledByDefault,
			};
		}

		if ( ! Object.keys( defaults ).length ) {
			return;
		}

		/*
		 * Seeding a default is not something the user did, so it must not register
		 * as an edit. Form markup that ships in a theme file, a pattern, or any
		 * post saved before these flags existed carries none of them, so without
		 * this the block dirties its post, template, or template part the moment
		 * the canvas mounts it and the editor offers to save changes nobody made.
		 */
		__unstableMarkNextChangeAsNotPersistent();
		setAttributes( defaults );
	}, [
		isLoading,
		integrations,
		attributes?.jetpackCRM,
		attributes?.mailpoet,
		attributes?.salesforceData,
		setAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	] );
}
