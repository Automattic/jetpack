// eslint-disable-next-line @wordpress/no-unsafe-wp-apis -- Grid is the easiest way to express the responsive 1→2 column card grid; reassess when it's promoted out of experimental.
import { __experimentalGrid as Grid } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { STORE_ID } from 'store';
import { EXPERIENCE, EXPERIENCE_ORDER } from './constants';
import ExperienceOption from './experience-option';
import './style.scss';

/**
 * Top-level dashboard control: a fieldset of cards. Each card carries its
 * own commit button (revealed on hover / focus) that saves the chosen
 * experience directly — no separate Save step.
 *
 * @return {import('react').Element} - The selector.
 */
export default function ExperienceSelector() {
	const { isUpdating, supportsOnlyClassicSearch, isWpcom } = useSelect(
		select => ( {
			isUpdating: select( STORE_ID ).isUpdatingJetpackSettings(),
			supportsOnlyClassicSearch: select( STORE_ID ).supportsOnlyClassicSearch(),
			isWpcom: select( STORE_ID ).isWpcom(),
		} ),
		[]
	);

	// On WordPress.com Simple sites, Off is managed from the .com side, so
	// hide the row here.
	const visibleExperiences = isWpcom
		? EXPERIENCE_ORDER.filter( experience => experience !== EXPERIENCE.OFF )
		: EXPERIENCE_ORDER;

	const isExperienceDisabled = experience =>
		isUpdating ||
		( supportsOnlyClassicSearch &&
			( experience === EXPERIENCE.EMBEDDED || experience === EXPERIENCE.OVERLAY ) );

	return (
		<>
			<h1
				id="jp-search-experience-selector-heading"
				className="jp-search-experience-selector__heading"
			>
				{ __( 'Select a search experience for your visitors', 'jetpack-search-pkg' ) }
			</h1>
			<div className="jp-search-experience-selector">
				<fieldset
					className="jp-search-experience-selector__fieldset"
					aria-labelledby="jp-search-experience-selector-heading"
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
			</div>
		</>
	);
}
