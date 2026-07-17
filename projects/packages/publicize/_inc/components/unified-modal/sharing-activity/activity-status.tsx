import { Badge } from '@automattic/ui';
import { Button, Dropdown, Flex } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { info } from '@wordpress/icons';
import styles from './styles.module.scss';
import { SharingActivityItem } from './types';

type DropdownRenderToggleProps = {
	onToggle: VoidFunction;
	isOpen: boolean;
};

interface ActivityStatusProps {
	item: SharingActivityItem;
}

/**
 * Status badge component for sharing activity items.
 *
 * @param {ActivityStatusProps} props - Component props
 * @return React element
 */
export function ActivityStatus( { item }: ActivityStatusProps ) {
	const renderToggle = useCallback(
		( { onToggle, isOpen }: DropdownRenderToggleProps ) => (
			<Button
				size="small"
				onClick={ onToggle }
				aria-expanded={ isOpen }
				icon={ info }
				label={ __( 'Details', 'jetpack-publicize-pkg' ) }
				showTooltip={ false }
				// the button is not destructive, this is just to match the red color of the error badge
				isDestructive
				variant="tertiary"
			/>
		),
		[]
	);

	const renderContent = useCallback( () => {
		if ( item.activityType === 'shared' ) {
			return <div>{ item.message }</div>;
		}
		return null;
	}, [ item ] );

	if ( item.status === 'scheduled' ) {
		return <Badge intent="info">{ __( 'Scheduled', 'jetpack-publicize-pkg' ) }</Badge>;
	}

	if ( item.status === 'success' ) {
		return <Badge intent="success">{ __( 'Shared', 'jetpack-publicize-pkg' ) }</Badge>;
	}

	// Failure status - show badge with error details dropdown
	return (
		<Flex justify="start" gap={ 1 }>
			<Badge intent="error">{ __( 'Failed', 'jetpack-publicize-pkg' ) }</Badge>
			<Dropdown
				focusOnMount
				popoverProps={ { placement: 'top-start' } }
				renderToggle={ renderToggle }
				renderContent={ renderContent }
				className={ styles.dropdown }
				contentClassName={ styles[ 'dropdown-content' ] }
			/>
		</Flex>
	);
}
