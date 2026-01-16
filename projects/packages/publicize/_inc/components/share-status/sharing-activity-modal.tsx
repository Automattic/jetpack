import { ThemeProvider } from '@automattic/jetpack-components';
import { Modal, TabPanel } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import { ShareList } from './share-list';
import styles from './styles.module.scss';

/**
 * Sharing activity modal component with tabs.
 *
 * @return {import('react').ReactNode} - Sharing activity modal component.
 */
export function SharingActivityModal() {
	const { closeSharingActivityModal } = useDispatch( socialStore );

	const tabs = [
		{
			name: 'all',
			title: __( 'All shares', 'jetpack-publicize-pkg' ),
		},
		{
			name: 'shared',
			title: __( 'Shared', 'jetpack-publicize-pkg' ),
		},
		{
			name: 'scheduled',
			title: __( 'Scheduled', 'jetpack-publicize-pkg' ),
		},
	];

	return (
		<div className={ styles.wrapper }>
			<Modal
				onRequestClose={ closeSharingActivityModal }
				title={ __( 'Sharing activity', 'jetpack-publicize-pkg' ) }
				className={ styles.modal }
			>
				<div className={ styles[ 'tab-panel-wrapper' ] }>
					<TabPanel tabs={ tabs }>
						{ tab => {
							// For now, just show the existing share list under the "Shared" tab
							// Other tabs will be implemented later
							if ( tab.name === 'shared' ) {
								return <ShareList />;
							}
							return (
								<div style={ { padding: '20px', textAlign: 'center' } }>
									{ __( 'Coming soon', 'jetpack-publicize-pkg' ) }
								</div>
							);
						} }
					</TabPanel>
				</div>
			</Modal>
		</div>
	);
}

/**
 * Themed sharing activity modal component.
 *
 * This component can be used to avoid dealing with modal state management.
 *
 * @return {import('react').ReactNode} - React element
 */
export function ThemedSharingActivityModal() {
	const shouldModalBeOpen = useSelect(
		select => select( socialStore ).isSharingActivityModalOpen(),
		[]
	);

	return (
		<ThemeProvider targetDom={ document.body }>
			{ shouldModalBeOpen ? <SharingActivityModal /> : null }
		</ThemeProvider>
	);
}
