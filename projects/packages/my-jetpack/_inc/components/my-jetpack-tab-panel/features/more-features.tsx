import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import { JetpackButton } from './feature-action';
import { FeatureItem } from './feature-item';
import { FeatureList } from './feature-list';
import styles from './styles.module.scss';
import type { FeatureSelection } from './use-feature-selection';
import type { MoreFeaturesGroup } from './use-more-features';
import type { ReactNode } from 'react';

type MoreFeaturesProps = {
	groups: MoreFeaturesGroup[];
	selection: FeatureSelection;
	jetpack: MainFeaturePluginStatus;
	isList?: boolean;
	isNarrowed?: boolean;
};

/**
 * Jetpack's other modules, under headings, below the main features.
 *
 * The cards are the main features' own, minus the icon and the details modal, so the two
 * lists cannot drift apart. Shown only where Jetpack is installed; while it is off, the
 * modules cannot be read, so the section offers to activate it instead.
 *
 * @param {MoreFeaturesProps}   props            - The component props.
 * @param {MoreFeaturesGroup[]} props.groups     - The modules to show, grouped.
 * @param {FeatureSelection}    props.selection  - The selection shared with the bulk bar.
 * @param {string}              props.jetpack    - The Jetpack plugin's status.
 * @param {boolean}             props.isList     - Whether the tab is in its list view.
 * @param {boolean}             props.isNarrowed - Whether a filter or a search is in play, which an offer to activate Jetpack cannot answer.
 * @return The rendered component, or null when there is nothing to show.
 */
export function MoreFeatures( {
	groups,
	selection,
	jetpack,
	isList = false,
	isNarrowed = false,
}: MoreFeaturesProps ) {
	if ( jetpack === 'not-installed' || ( jetpack === 'active' && ! groups.length ) ) {
		return null;
	}

	// The page above has already said nothing matched; an offer to activate Jetpack is not an
	// answer to a filter or a search.
	if ( jetpack === 'inactive' && isNarrowed ) {
		return null;
	}

	let body: ReactNode;

	if ( jetpack === 'inactive' ) {
		body = (
			<div className={ styles[ 'more-features__inactive' ] }>
				<Text variant="body-md">
					{ __(
						'Activate the Jetpack plugin to see and switch its other features.',
						'jetpack-my-jetpack'
					) }
				</Text>
				<JetpackButton installed />
			</div>
		);
	} else {
		body = groups.map( group => (
			<div key={ group.label } className={ styles[ 'more-features__group' ] }>
				<Text variant="heading-lg" render={ <h3 /> } className={ styles[ 'feature-item__title' ] }>
					{ group.label }
				</Text>
				{ isList ? (
					<FeatureList states={ group.states } selection={ selection } showIcon={ false } />
				) : (
					<div className={ styles[ 'feature-grid' ] }>
						{ group.states.map( state => (
							<FeatureItem key={ state.feature.slug } state={ state } showIcon={ false } />
						) ) }
					</div>
				) }
			</div>
		) );
	}

	return (
		<section className={ styles[ 'more-features' ] } aria-labelledby="more-features-heading">
			<Text variant="heading-xl" render={ <h2 id="more-features-heading" /> }>
				{ __( 'More Features', 'jetpack-my-jetpack' ) }
			</Text>
			{ body }
		</section>
	);
}
