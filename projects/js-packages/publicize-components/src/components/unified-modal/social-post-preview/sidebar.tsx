/* eslint-disable @wordpress/no-unsafe-wp-apis */
import { __experimentalGrid as Grid } from '@wordpress/components';
import { Connection } from '../../../social-store/types';
import { MediaValidationNotices } from '../../form/media-validation-notices';
import { SharePostForm } from '../../form/share-post-form';
import { ConnectionList } from './connection-list';
import { ConnectionToggles } from './connection-toggles';
import styles from './styles.module.scss';

type SidebarProps = {
	baseId: string;
	onSelectConnection: ( connection: Connection ) => void;
	selectedConnection: Connection | null;
	forSmallScreen?: boolean;
};

/**
 * Sidebar component for the social preview modal.
 *
 * @param {SidebarProps} props - The component props.
 * @return - Sidebar component.
 */
export function Sidebar( {
	baseId,
	forSmallScreen,
	onSelectConnection,
	selectedConnection,
}: SidebarProps ) {
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
			{ ! forSmallScreen && (
				<>
					<div className={ styles[ 'notice-wrapper' ] }>
						<MediaValidationNotices />
					</div>
					<div className={ styles[ 'customization-form' ] }>
						<SharePostForm analyticsData={ { location: 'preview-modal' } } isInsideNavigatorModal />
					</div>
				</>
			) }
		</div>
	);
}
