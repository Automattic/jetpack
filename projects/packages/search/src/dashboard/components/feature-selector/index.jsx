import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Button, Stack } from '@wordpress/ui';
import { STORE_ID } from 'store';
import { EXPERIENCE_ORDER } from './constants';
import ExperienceOption from './experience-option';
import './style.scss';

/**
 * Top-level dashboard control: a fieldset of four radio rows plus a Save
 * button. Subscribes to the store for `isDirty` and `is_updating`; dispatches
 * `saveExperience` with the user's selection on submit.
 *
 * The Save button uses `@wordpress/ui` Button's `disabled` prop, which (with
 * `focusableWhenDisabled` true by default) renders `aria-disabled="true"`
 * rather than the native `disabled` attribute, so focus order is preserved.
 *
 * @return {import('react').Element} - The selector.
 */
export default function FeatureSelector() {
	const isDirty = useSelect( select => select( STORE_ID ).isDirty(), [] );
	const isUpdating = useSelect( select => select( STORE_ID ).isUpdatingJetpackSettings(), [] );
	const pendingExperience = useSelect( select => select( STORE_ID ).getPendingExperience(), [] );
	const supportsOnlyClassicSearch = useSelect(
		select => select( STORE_ID ).supportsOnlyClassicSearch(),
		[]
	);
	const { saveExperience } = useDispatch( STORE_ID );

	const isExperienceDisabled = experience =>
		supportsOnlyClassicSearch && ( experience === 'embedded' || experience === 'overlay' );

	const isSaveDisabled = ! isDirty || isUpdating;

	const onSubmit = event => {
		event.preventDefault();
		if ( isSaveDisabled ) {
			return;
		}
		saveExperience( pendingExperience );
	};

	return (
		<>
			<h2 id="jp-search-feature-selector-heading" className="jp-search-feature-selector__heading">
				{ __( 'Pick what visitors see when they search', 'jetpack-search-pkg' ) }
			</h2>
			<form className="jp-search-feature-selector" onSubmit={ onSubmit }>
				<fieldset
					className="jp-search-feature-selector__fieldset"
					aria-labelledby="jp-search-feature-selector-heading"
				>
					<Stack direction="column" gap="sm">
						{ EXPERIENCE_ORDER.map( experience => (
							<ExperienceOption
								key={ experience }
								experience={ experience }
								disabled={ isExperienceDisabled( experience ) }
							/>
						) ) }
					</Stack>
				</fieldset>
				<Stack
					gap="md"
					align="center"
					justify="space-between"
					className="jp-search-feature-selector__footer"
					aria-live="polite"
				>
					<p className="jp-search-feature-selector__status">
						{ isUpdating && __( 'Saving…', 'jetpack-search-pkg' ) }
					</p>
					<Button type="submit" disabled={ isSaveDisabled } loading={ isUpdating }>
						{ __( 'Save', 'jetpack-search-pkg' ) }
					</Button>
				</Stack>
			</form>
		</>
	);
}
