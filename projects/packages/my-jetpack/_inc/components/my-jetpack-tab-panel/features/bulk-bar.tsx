import { CheckboxControl } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Button, Text } from '@wordpress/ui';
import styles from './styles.module.scss';
import type { FeatureSelection } from './use-feature-selection';

type BulkBarProps = {
	selection: FeatureSelection;
};

/**
 * The bar that switches every selected row, in both lists, at once.
 *
 * @param {BulkBarProps}     props           - The component props.
 * @param {FeatureSelection} props.selection - What is selected, and what may be done with it.
 * @return The rendered component.
 */
export function BulkBar( { selection }: BulkBarProps ) {
	const {
		allSelected,
		selectedCount,
		selectableCount,
		isBusy,
		onSelectAll,
		toActivate,
		toDeactivate,
		pluginsHeldBack,
		onActivate,
		onDeactivate,
	} = selection;

	const count = sprintf(
		/* translators: %d is how many features are selected. */
		_n( '%d selected', '%d selected', selectedCount, 'jetpack-my-jetpack' ),
		selectedCount
	);
	const heldBackNote = __(
		'Plugins can only be deactivated together while the Jetpack plugin is active.',
		'jetpack-my-jetpack'
	);

	return (
		<div className={ styles[ 'bulk-bar' ] }>
			<CheckboxControl
				__nextHasNoMarginBottom
				checked={ allSelected }
				indeterminate={ selectedCount > 0 && ! allSelected }
				disabled={ ! selectableCount || isBusy }
				onChange={ onSelectAll }
				aria-label={ __( 'Select all features', 'jetpack-my-jetpack' ) }
			/>
			<Text variant="body-md" className={ styles[ 'bulk-bar__count' ] } role="status">
				{ selectedCount
					? count
					: __( 'Select features to switch several at once', 'jetpack-my-jetpack' ) }
				{ pluginsHeldBack ? ` ${ heldBackNote }` : null }
			</Text>
			<Button
				variant="outline"
				size="compact"
				disabled={ isBusy || ! toActivate.length }
				onClick={ onActivate }
			>
				{ __( 'Activate', 'jetpack-my-jetpack' ) }
			</Button>
			<Button
				variant="outline"
				size="compact"
				disabled={ isBusy || ! toDeactivate.length }
				onClick={ onDeactivate }
			>
				{ __( 'Deactivate', 'jetpack-my-jetpack' ) }
			</Button>
		</div>
	);
}
