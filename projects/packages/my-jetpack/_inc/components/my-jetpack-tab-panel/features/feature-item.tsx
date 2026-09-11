import { __ } from '@wordpress/i18n';
import { Badge, Stack, Text } from '@wordpress/ui';
import { FeatureChevron } from './feature-chevron';
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
 * @param {FeatureItemProps} props        - The component props.
 * @param {FeatureState}     props.state  - Live state for the feature.
 * @param {Function}         props.onOpen - Opens the feature's details.
 * @return The rendered component.
 */
export function FeatureItem( { state, onOpen }: FeatureItemProps ) {
	const { feature } = state;
	const isActive = state.status === 'active';

	return (
		<Stack
			direction="column"
			gap="md"
			className={ styles[ 'feature-item' ] }
			data-feature={ feature.slug }
		>
			<Stack direction="row" align="start" gap="md">
				<FeatureIcon feature={ feature } />

				<Stack direction="column" gap="xs" className={ styles[ 'feature-item__details' ] }>
					<Stack direction="row" align="center" gap="xs" wrap="wrap">
						<Text variant="heading-md">{ feature.name }</Text>
						{ feature.essential ? (
							<Badge intent="informational">{ __( 'Essential', 'jetpack-my-jetpack' ) }</Badge>
						) : null }
					</Stack>

					<div>
						<Badge intent={ isActive ? 'stable' : 'none' }>
							{ isActive
								? __( 'Active', 'jetpack-my-jetpack' )
								: __( 'Inactive', 'jetpack-my-jetpack' ) }
						</Badge>
					</div>

					<Text variant="body-sm" className={ styles[ 'feature-item__description' ] }>
						{ feature.description }
					</Text>
				</Stack>

				{ /* Reserved whether or not this feature has a toggle, so the details column
				     keeps the same width across the grid. */ }
				<div className={ styles[ 'feature-toggle-slot' ] }>
					<FeatureToggle state={ state } />
				</div>
			</Stack>

			<div className={ styles[ 'feature-item__footer' ] }>
				<FeatureChevron state={ state } onOpen={ onOpen } />
			</div>
		</Stack>
	);
}
