import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Button, Stack } from '@wordpress/ui';
import { STORE_ID } from 'store';
import { EXPERIENCE, EXPERIENCE_ORDER } from './constants';
import ExperienceOption from './experience-option';
import './style.scss';

/**
 * Top-level dashboard control: a fieldset of four cards plus a Save button.
 *
 * `@wordpress/ui` Button's `disabled` prop renders `aria-disabled="true"`
 * rather than the native `disabled` attribute, so focus order is preserved.
 *
 * @return {import('react').Element} - The selector.
 */
export default function FeatureSelector() {
	const { isDirty, isUpdating, pendingExperience, supportsOnlyClassicSearch, isWpcom } = useSelect(
		select => ( {
			isDirty: select( STORE_ID ).isDirty(),
			isUpdating: select( STORE_ID ).isUpdatingJetpackSettings(),
			pendingExperience: select( STORE_ID ).getPendingExperience(),
			supportsOnlyClassicSearch: select( STORE_ID ).supportsOnlyClassicSearch(),
			isWpcom: select( STORE_ID ).isWpcom(),
		} ),
		[]
	);
	const { saveExperience } = useDispatch( STORE_ID );

	// On WordPress.com Simple sites, Off is managed from the .com side, so
	// hide the row here.
	const visibleExperiences = isWpcom
		? EXPERIENCE_ORDER.filter( experience => experience !== EXPERIENCE.OFF )
		: EXPERIENCE_ORDER;

	const isExperienceDisabled = experience =>
		isUpdating ||
		( supportsOnlyClassicSearch && ( experience === 'embedded' || experience === 'overlay' ) );

	const isSaveDisabled = ! isDirty || isUpdating;

	const getSaveLabel = () => {
		if ( ! isDirty ) {
			return __( 'Save', 'jetpack-search-pkg' );
		}
		switch ( pendingExperience ) {
			case EXPERIENCE.EMBEDDED:
				return __( 'Use Embedded search', 'jetpack-search-pkg' );
			case EXPERIENCE.OVERLAY:
				return __( 'Use Overlay search', 'jetpack-search-pkg' );
			case EXPERIENCE.INLINE:
				return __( 'Use Theme search', 'jetpack-search-pkg' );
			case EXPERIENCE.OFF:
				return __( 'Turn off Jetpack Search', 'jetpack-search-pkg' );
			default:
				return __( 'Save', 'jetpack-search-pkg' );
		}
	};

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
				{ __( 'Select a search experience for your visitors', 'jetpack-search-pkg' ) }
			</h2>
			<form className="jp-search-feature-selector" onSubmit={ onSubmit }>
				<fieldset
					className="jp-search-feature-selector__fieldset"
					aria-labelledby="jp-search-feature-selector-heading"
				>
					<div className="jp-search-feature-selector__grid">
						{ visibleExperiences.map( experience => (
							<ExperienceOption
								key={ experience }
								experience={ experience }
								disabled={ isExperienceDisabled( experience ) }
							/>
						) ) }
					</div>
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
						{ getSaveLabel() }
					</Button>
				</Stack>
			</form>
		</>
	);
}
