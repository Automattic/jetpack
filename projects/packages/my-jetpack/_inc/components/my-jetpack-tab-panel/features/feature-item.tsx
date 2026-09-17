import { __, isRTL } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { Badge, Icon, Text } from '@wordpress/ui';
import { getActivationStatusLabel } from '../utils';
import { FeatureIcon } from './feature-icon';
import { FeatureToggle } from './feature-toggle';
import styles from './styles.module.scss';
import type { FeatureState } from './feature-state';

type FeatureItemProps = {
	state: FeatureState;
};

/**
 * Where a card sends you: the feature's own page once it is running, and the offer to
 * add it before that. Under the hash router an internal route is a real href, so the
 * card stays a link either way.
 *
 * @param state - Live state for the feature.
 * @return The URL, or an empty string when the feature has nowhere to go.
 */
function getDestination( state: FeatureState ): string {
	const { feature } = state;

	if ( state.status === 'active' && feature.manage_url ) {
		return feature.manage_url;
	}

	return feature.learn_more_route ? `#${ feature.learn_more_route }` : feature.manage_url;
}

/**
 * A single card in the features grid.
 *
 * Built as the navigation row the AI Hub uses — leading glyph, title and description,
 * trailing chevron — so a feature reads as one place to go rather than a panel of
 * separate controls. The title carries the link and stretches over the whole card.
 *
 * @param {FeatureItemProps} props       - The component props.
 * @param {FeatureState}     props.state - Live state for the feature.
 * @return The rendered component.
 */
export function FeatureItem( { state }: FeatureItemProps ) {
	const { feature } = state;
	const isActive = state.status === 'active';
	const chevron = isRTL() ? chevronLeft : chevronRight;
	const href = getDestination( state );

	return (
		<div className={ styles[ 'feature-item' ] } data-feature={ feature.slug }>
			<span className={ styles[ 'feature-item__icon' ] } aria-hidden="true">
				<FeatureIcon feature={ feature } />
			</span>

			<span className={ styles[ 'feature-item__text' ] }>
				<span className={ styles[ 'feature-item__heading' ] }>
					<Text
						variant="heading-lg"
						className={ styles[ 'feature-item__title' ] }
						render={
							href ? <a href={ href } className={ styles[ 'feature-item__open' ] } /> : undefined
						}
					>
						{ feature.name }
					</Text>

					<Badge intent={ isActive ? 'stable' : 'none' }>
						{ getActivationStatusLabel( isActive ) }
					</Badge>

					{ feature.essential ? (
						<Badge intent="informational">{ __( 'Essential', 'jetpack-my-jetpack' ) }</Badge>
					) : null }
				</span>

				<Text variant="body-md" className={ styles[ 'feature-item__description' ] }>
					{ feature.description }
				</Text>
			</span>

			<span className={ styles[ 'feature-toggle-slot' ] }>
				<FeatureToggle state={ state } />
			</span>

			{ /* Left under the stretched title on purpose: it points at the card's own
			     destination, so a click on it should follow the link like any other. */ }
			{ href ? (
				<span className={ styles[ 'feature-item__chevron' ] } aria-hidden="true">
					<Icon icon={ chevron } size={ 24 } />
				</span>
			) : null }
		</div>
	);
}
