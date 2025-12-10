/* eslint-disable @wordpress/no-unsafe-wp-apis */
import { __experimentalGrid as Grid } from '@wordpress/components';
import { Connection } from '../../../social-store/types';
import { ConnectionList } from './connection-list';
import { ConnectionToggles } from './connection-toggles';
import styles from './styles.module.scss';

type SidebarProps = {
	baseId: string;
	onSelectConnection: ( connection: Connection ) => void;
	selectedConnection: Connection | null;
};

/**
 * Sidebar component for the social preview modal.
 *
 * @param {SidebarProps} props - The component props.
 * @return - Sidebar component.
 */
export function Sidebar( { onSelectConnection, baseId, selectedConnection }: SidebarProps ) {
	return (
		<div className={ styles.sidebar }>
			<Grid columns={ 2 } templateColumns="auto 1fr" gap={ 0 } className={ styles.grid }>
				<ConnectionToggles selectedConnection={ selectedConnection } />
				<ConnectionList
					baseId={ baseId }
					onSelectConnection={ onSelectConnection }
					selectedConnection={ selectedConnection }
				/>
			</Grid>
		</div>
	);
}
