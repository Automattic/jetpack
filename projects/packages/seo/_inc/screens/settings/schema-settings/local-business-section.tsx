/* eslint-disable react/jsx-no-bind */

import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import LocalBusinessFields from './local-business-fields';
import type { SchemaSettingsForm } from '../../../data/use-schema-settings';
import type { FC } from 'react';

interface Props {
	/** The schema-settings form controller, owned by the Schema card group. */
	form: SchemaSettingsForm;
}

/**
 * The Local business refinement of the Organization entity: a toggle that reveals
 * the address / contact / hours fields. Presentational only — it shares the
 * Organization's single Save button in the parent Schema card.
 *
 * @param props      - Component props.
 * @param props.form - The shared schema-settings form controller.
 * @return The Local business settings fields.
 */
const LocalBusinessSection: FC< Props > = ( { form } ) => {
	const { localBusiness, isSaving, setLocalBusinessField } = form;

	return (
		<Stack direction="column" gap="lg">
			<ToggleControl
				label={ __( 'This is a local business', 'jetpack-seo' ) }
				help={ __(
					'Turn on if customers visit you in person (a shop, studio, restaurant, clinic). Adds your address, phone, and hours so search engines can show your local details.',
					'jetpack-seo'
				) }
				checked={ localBusiness.enabled }
				onChange={ next => setLocalBusinessField( { enabled: next } ) }
				disabled={ isSaving }
				__nextHasNoMarginBottom
			/>

			{ localBusiness.enabled && <LocalBusinessFields form={ form } /> }
		</Stack>
	);
};

export default LocalBusinessSection;
