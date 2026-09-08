import { __ } from '@wordpress/i18n';
import { Badge, Checkbox, Stack, Text } from '@wordpress/ui';
import { useCallback } from 'react';
import { FeatureChevron } from './feature-chevron';
import { FeatureIcon } from './feature-icon';
import { FeatureToggle } from './feature-toggle';
import styles from './styles.module.scss';
import type { FeatureState } from './feature-state';

type FeatureItemProps = {
	state: FeatureState;
	selected: boolean;
	onSelect: ( slug: string, checked: boolean ) => void;
	onOpen: ( slug: string ) => void;
};

/**
 * A single row in the main features list.
 *
 * @param {FeatureItemProps} props          - The component props.
 * @param {FeatureState}     props.state    - Live state for the feature.
 * @param {boolean}          props.selected - Whether the row is selected for a bulk action.
 * @param {Function}         props.onSelect - Called when the row's checkbox changes.
 * @param {Function}         props.onOpen   - Opens the feature's details.
 * @return The rendered component.
 */
export function FeatureItem( { state, selected, onSelect, onOpen }: FeatureItemProps ) {
	const { feature } = state;
	const isActive = state.status === 'active';

	const onCheckedChange = useCallback(
		( checked: boolean ) => onSelect( feature.slug, checked ),
		[ feature.slug, onSelect ]
	);

	return (
		<Stack
			direction="row"
			align="center"
			gap="md"
			className={ styles[ 'feature-item' ] }
			data-feature={ feature.slug }
		>
			<Checkbox
				checked={ selected }
				disabled={ ! state.selectable }
				onCheckedChange={ onCheckedChange }
				aria-label={ feature.name }
			/>

			<FeatureIcon feature={ feature } />

			<Stack direction="column" gap="xs" className={ styles[ 'feature-item__details' ] }>
				<Stack direction="row" align="center" gap="sm" wrap="wrap">
					<Text variant="heading-md">{ feature.name }</Text>
					<Badge intent={ isActive ? 'stable' : 'none' }>
						{ isActive
							? __( 'Active', 'jetpack-my-jetpack' )
							: __( 'Inactive', 'jetpack-my-jetpack' ) }
					</Badge>
					{ feature.essential ? (
						<Badge intent="informational">{ __( 'Essential', 'jetpack-my-jetpack' ) }</Badge>
					) : null }
				</Stack>
				<Text variant="body-sm">{ feature.description }</Text>
			</Stack>

			<FeatureChevron state={ state } onOpen={ onOpen } />

			{ /* Reserved whether or not this feature has a toggle, so the Learn more
			     button lines up down the whole list. */ }
			<div className={ styles[ 'feature-toggle-slot' ] }>
				<FeatureToggle state={ state } />
			</div>
		</Stack>
	);
}
