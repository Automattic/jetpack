import { TextControl, TextareaControl } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { pickPlaceholder } from './lib.ts';
import type { GoalSlug } from '../lib/types.ts';

interface Props {
	goal: GoalSlug | null;
	siteName: string;
	intent: string;
	onSiteNameChange: ( value: string ) => void;
	onIntentChange: ( value: string ) => void;
}

/**
 * Example placeholders per goal.
 *
 * @param goal - The selected goal, or null.
 * @return The placeholder variants for the goal.
 */
function intentVariants( goal: GoalSlug | null ): string[] {
	return {
		write: [
			__( 'e.g. A blog about home cooking and weeknight recipes.', 'jetpack-mu-wpcom' ),
			__( 'e.g. A travel diary of weekend trips around the Mediterranean.', 'jetpack-mu-wpcom' ),
			__( 'e.g. A personal blog about parenting a toddler.', 'jetpack-mu-wpcom' ),
			__( 'e.g. A blog reviewing the books I read this year.', 'jetpack-mu-wpcom' ),
			__( 'e.g. A blog about training for my first marathon.', 'jetpack-mu-wpcom' ),
		],
		build: [
			__( 'e.g. A site for a neighborhood yoga studio.', 'jetpack-mu-wpcom' ),
			__( 'e.g. A site for my freelance design studio.', 'jetpack-mu-wpcom' ),
			__( 'e.g. A site for a family-run Italian restaurant.', 'jetpack-mu-wpcom' ),
			__( 'e.g. A site for a real estate agent in Brooklyn.', 'jetpack-mu-wpcom' ),
			__( 'e.g. A site for a small dental practice.', 'jetpack-mu-wpcom' ),
		],
		sell: [
			__( 'e.g. A shop selling handmade ceramics.', 'jetpack-mu-wpcom' ),
			__( 'e.g. A shop selling vintage clothing.', 'jetpack-mu-wpcom' ),
			__( 'e.g. A shop selling digital art prints.', 'jetpack-mu-wpcom' ),
			__( 'e.g. A shop selling homemade candles and soap.', 'jetpack-mu-wpcom' ),
			__( 'e.g. A shop selling specialty coffee beans.', 'jetpack-mu-wpcom' ),
		],
		newsletter: [
			__( 'e.g. A weekly newsletter about indie games.', 'jetpack-mu-wpcom' ),
			__( 'e.g. A newsletter about local food and restaurants.', 'jetpack-mu-wpcom' ),
			__( 'e.g. A newsletter for parents of toddlers.', 'jetpack-mu-wpcom' ),
			__( 'e.g. A newsletter about indie tech and startups.', 'jetpack-mu-wpcom' ),
			__( 'e.g. A monthly newsletter on personal finance for freelancers.', 'jetpack-mu-wpcom' ),
		],
		educate: [
			__( 'e.g. A small homeschool community for new families.', 'jetpack-mu-wpcom' ),
			__( 'e.g. A nonprofit raising awareness for ocean cleanup.', 'jetpack-mu-wpcom' ),
			__( 'e.g. An online course about modern poetry.', 'jetpack-mu-wpcom' ),
			__( "e.g. A site for our local church's bulletin and events.", 'jetpack-mu-wpcom' ),
			__( 'e.g. A community of urban beekeepers in Lisbon.', 'jetpack-mu-wpcom' ),
		],
		portfolio: [
			__( 'e.g. A portfolio of my illustration work.', 'jetpack-mu-wpcom' ),
			__( 'e.g. A portfolio of my photography projects.', 'jetpack-mu-wpcom' ),
			__( 'e.g. A portfolio of my UX design case studies.', 'jetpack-mu-wpcom' ),
			__( 'e.g. A portfolio of architecture projects.', 'jetpack-mu-wpcom' ),
			__( 'e.g. A portfolio of my writing samples and clips.', 'jetpack-mu-wpcom' ),
		],
	}[ goal ?? 'write' ];
}

/**
 * Pick one stable example placeholder for the current goal. It stays fixed
 * while the user types but rotates the next time they land on this step.
 *
 * @param goal - The selected goal, or null.
 * @return One example placeholder.
 */
function useIntentPlaceholder( goal: GoalSlug | null ): string {
	const variants = intentVariants( goal );
	// Re-roll the example once per goal change, not on every render.
	return useMemo(
		() => pickPlaceholder( variants ),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ goal ]
	);
}

/**
 * Step 2 of the wizard: site name and free-text description.
 *
 * @param props                  - Component props.
 * @param props.goal             - The goal picked on step 1.
 * @param props.siteName         - The current site name value.
 * @param props.intent           - The current description value.
 * @param props.onSiteNameChange - Called when the site name changes.
 * @param props.onIntentChange   - Called when the description changes.
 * @return The details step.
 */
export default function DetailsStep( {
	goal,
	siteName,
	intent,
	onSiteNameChange,
	onIntentChange,
}: Props ) {
	const intentPlaceholder = useIntentPlaceholder( goal );

	return (
		<div className="ai-launchpad-wizard__step">
			<h2 className="ai-launchpad-wizard__step-title">
				{ __( 'Tell us about your site', 'jetpack-mu-wpcom' ) }
			</h2>

			<TextControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label={ __( 'Site name', 'jetpack-mu-wpcom' ) }
				value={ siteName }
				onChange={ onSiteNameChange }
			/>

			<TextareaControl
				__nextHasNoMarginBottom
				label={ __( 'Brief description', 'jetpack-mu-wpcom' ) }
				placeholder={ intentPlaceholder }
				value={ intent }
				onChange={ onIntentChange }
				rows={ 4 }
			/>
		</div>
	);
}
