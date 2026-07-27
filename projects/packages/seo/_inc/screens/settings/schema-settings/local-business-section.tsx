/* eslint-disable react/jsx-no-bind */

import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Button, Stack } from '@wordpress/ui';
import LocalBusinessFields, { hasLocalBusinessErrors } from './local-business-fields';
import type { SchemaSettingsForm } from '../../../data/use-schema-settings';
import type { FC } from 'react';

const saveLabel = __( 'Save', 'jetpack-seo' );

interface Props {
	/** The schema-settings form controller, owned by the Schema card group. */
	form: SchemaSettingsForm;
}

/**
 * The Local business settings form.
 *
 * @param props      - Component props.
 * @param props.form - The shared schema-settings form controller.
 * @return The Local business settings form.
 */
const LocalBusinessSection: FC< Props > = ( { form } ) => {
	const {
		localBusiness,
		isSaving,
		isLocalBusinessDirty,
		setLocalBusinessField,
		saveLocalBusiness,
	} = form;

	return (
		<Stack direction="column" gap="lg">
			<ToggleControl
				label={ __( 'This site represents a local business', 'jetpack-seo' ) }
				help={ __(
					"Adds your business details (address, phone, hours) to the site's schema so search engines can show local info.",
					'jetpack-seo'
				) }
				checked={ localBusiness.enabled }
				onChange={ next => setLocalBusinessField( { enabled: next } ) }
				disabled={ isSaving }
				__nextHasNoMarginBottom
			/>

			{ localBusiness.enabled && <LocalBusinessFields form={ form } /> }

			<Stack direction="row" justify="flex-end">
				<Button
					onClick={ saveLocalBusiness }
					disabled={
						isSaving ||
						! isLocalBusinessDirty ||
						( localBusiness.enabled && hasLocalBusinessErrors( form ) )
					}
					aria-label={ __( 'Save local business', 'jetpack-seo' ) }
				>
					{ saveLabel }
				</Button>
			</Stack>
		</Stack>
	);
};

export default LocalBusinessSection;
