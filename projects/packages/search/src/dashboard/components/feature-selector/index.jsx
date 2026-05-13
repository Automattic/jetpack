// eslint-disable-next-line @wordpress/no-unsafe-wp-apis -- Grid is the easiest way to express the responsive 1→2 column card grid; reassess when it's promoted out of experimental.
import { __experimentalGrid as Grid } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
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
	const { isDirty, isUpdating, pendingExperience, supportsInstantSearch, isWpcom } = useSelect(
		select => ( {
			isDirty: select( STORE_ID ).isDirty(),
			isUpdating: select( STORE_ID ).isUpdatingJetpackSettings(),
			pendingExperience: select( STORE_ID ).getPendingExperience(),
			supportsInstantSearch: select( STORE_ID ).supportsInstantSearch(),
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
		( ! supportsInstantSearch && ( experience === 'embedded' || experience === 'overlay' ) );

	const isSaveDisabled = ! isDirty || isUpdating;

	const getSaveLabel = () => {
		if ( ! isDirty ) {
			return __( 'Save', 'jetpack-search-pkg' );
		}
		switch ( pendingExperience ) {
			case EXPERIENCE.EMBEDDED:
				return _x(
					'Use Embedded search',
					'Button label that activates the Embedded search experience',
					'jetpack-search-pkg'
				);
			case EXPERIENCE.OVERLAY:
				return _x(
					'Use Overlay search',
					'Button label that activates the Overlay search experience',
					'jetpack-search-pkg'
				);
			case EXPERIENCE.INLINE:
				return _x(
					'Use Theme search',
					"Button label that activates the theme's built-in search",
					'jetpack-search-pkg'
				);
			case EXPERIENCE.OFF:
				return _x(
					'Turn off Jetpack Search',
					'Button label that disables Jetpack Search entirely',
					'jetpack-search-pkg'
				);
			default:
				return __( 'Save', 'jetpack-search-pkg' );
		}
	};

	// Inline reminder rendered next to the heading once the form is dirty, so
	// users on shorter screens know they still need to scroll down to save.
	const getPendingNotice = () => {
		switch ( pendingExperience ) {
			case EXPERIENCE.EMBEDDED:
				return _x(
					'Embedded search selected, save to apply',
					'Dirty-state notice shown next to the heading',
					'jetpack-search-pkg'
				);
			case EXPERIENCE.OVERLAY:
				return _x(
					'Overlay search selected, save to apply',
					'Dirty-state notice shown next to the heading',
					'jetpack-search-pkg'
				);
			case EXPERIENCE.INLINE:
				return _x(
					'Theme search selected, save to apply',
					'Dirty-state notice shown next to the heading',
					'jetpack-search-pkg'
				);
			case EXPERIENCE.OFF:
				return _x(
					'Off selected, save to apply',
					'Dirty-state notice shown next to the heading',
					'jetpack-search-pkg'
				);
			default:
				return '';
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
			<Stack
				direction="row"
				align="center"
				justify="space-between"
				gap="md"
				wrap="wrap"
				className="jp-search-feature-selector__heading-row"
				aria-live="polite"
			>
				<h2 id="jp-search-feature-selector-heading" className="jp-search-feature-selector__heading">
					{ __( 'Select a search experience for your visitors', 'jetpack-search-pkg' ) }
				</h2>
				{ isDirty && (
					<p className="jp-search-feature-selector__pending-notice">{ getPendingNotice() }</p>
				) }
			</Stack>
			<form className="jp-search-feature-selector" onSubmit={ onSubmit }>
				<fieldset
					className="jp-search-feature-selector__fieldset"
					aria-labelledby="jp-search-feature-selector-heading"
				>
					{ /* Grid's `gap` is a unitless multiplier of its internal
					   gridBase (4px), so `gap={ 6 }` → 24px. This bypasses
					   WPDS spacing tokens but is the experimental API's only
					   spacing knob. */ }
					<Grid columns={ [ 1, 2 ] } gap={ 6 }>
						{ visibleExperiences.map( experience => (
							<ExperienceOption
								key={ experience }
								experience={ experience }
								disabled={ isExperienceDisabled( experience ) }
							/>
						) ) }
					</Grid>
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
