import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { STORE_ID } from 'store';
import { EXPERIENCE_ORDER } from './constants';
import ExperienceOption from './experience-option';
import './style.scss';

/**
 * Top-level dashboard control: a fieldset of four radio rows plus a Save
 * button. Subscribes to the store for `isDirty` and `is_updating`; dispatches
 * `saveExperience` with the user's selection on submit.
 *
 * Note: We use `aria-disabled` (not the `disabled` attribute) on Save so
 * focus order is preserved and the button stays discoverable. The handler
 * short-circuits when not dirty.
 *
 * `@wordpress/components` Button is used here because the package's existing
 * dashboard already imports it; switching to `@wordpress/ui` would pull a new
 * runtime dep into a build that doesn't otherwise need it. The Linear ticket
 * preferred `@wordpress/ui`; we'll migrate the whole dashboard's primitives
 * in a separate PR.
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
		if ( isSaveDisabled || ! pendingExperience ) {
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
					<div className="jp-search-feature-selector__options">
						{ EXPERIENCE_ORDER.map( experience => (
							<ExperienceOption
								key={ experience }
								experience={ experience }
								disabled={ isExperienceDisabled( experience ) }
							/>
						) ) }
					</div>
				</fieldset>
				<div className="jp-search-feature-selector__footer" aria-live="polite">
					<p className="jp-search-feature-selector__status">
						{ isUpdating && __( 'Saving…', 'jetpack-search-pkg' ) }
					</p>
					<Button
						variant="primary"
						type="submit"
						aria-disabled={ isSaveDisabled }
						isBusy={ isUpdating }
					>
						{ __( 'Save', 'jetpack-search-pkg' ) }
					</Button>
				</div>
			</form>
		</>
	);
}
