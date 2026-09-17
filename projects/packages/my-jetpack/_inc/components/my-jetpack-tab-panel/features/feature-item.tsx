import { __, isRTL, sprintf } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { Badge, Icon, Text } from '@wordpress/ui';
import { useCallback } from 'react';
import useAnalytics from '../../../hooks/use-analytics';
import { getActivationStatusLabel } from '../utils';
import { FeatureIcon } from './feature-icon';
import { FeatureToggle } from './feature-toggle';
import styles from './styles.module.scss';
import type { FeatureState } from './feature-state';

type FeatureItemProps = {
	state: FeatureState;
	onOpen: ( slug: string ) => void;
};

/**
 * A single card in the features grid.
 *
 * Built as the navigation row the AI Hub uses — leading glyph, title and description,
 * trailing chevron — so a feature reads as one place to go rather than a panel of
 * separate controls. The title carries the click target and stretches over the whole
 * card; the toggle sits above it so it stays its own control.
 *
 * @param {FeatureItemProps} props        - The component props.
 * @param {FeatureState}     props.state  - Live state for the feature.
 * @param {Function}         props.onOpen - Opens the feature's details.
 * @return The rendered component.
 */
export function FeatureItem( { state, onOpen }: FeatureItemProps ) {
	const { recordEvent } = useAnalytics();
	const { feature } = state;
	const isActive = state.status === 'active';
	const chevron = isRTL() ? chevronLeft : chevronRight;

	const onClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_features_detail_click', {
			feature: feature.slug,
			status: state.status,
		} );
		onOpen( feature.slug );
	}, [ feature.slug, onOpen, recordEvent, state.status ] );

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
							// The accessible name keeps the visible title inside it, so the
							// stretched click target still reads as this feature's row.
							<button
								type="button"
								className={ styles[ 'feature-item__open' ] }
								onClick={ onClick }
								aria-label={ sprintf(
									/* translators: %s is the feature name. */
									__( 'Learn more about %s', 'jetpack-my-jetpack' ),
									feature.name
								) }
							/>
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

			{ /* Raised above the stretched title, so the switch stays its own control.
			     Reserved whether or not this feature has one, to keep the text column
			     the same width across the grid. */ }
			<span className={ styles[ 'feature-toggle-slot' ] }>
				<FeatureToggle state={ state } />
			</span>

			{ /* Left under the stretched title on purpose: it points at the row's own
			     action, so a click on it should open the feature like any other. */ }
			<span className={ styles[ 'feature-item__chevron' ] } aria-hidden="true">
				<Icon icon={ chevron } size={ 24 } />
			</span>
		</div>
	);
}
