import { Container } from '@automattic/jetpack-components';
import styles from './styles.module.scss';

export const MyJetpackTabPanelFooter = ( { children }: { children: React.ReactNode } ) => {
	return (
		<Container horizontalSpacing={ 4 } className={ styles[ 'my-jetpack-tab-panel-footer' ] }>
			{ children }
		</Container>
	);
};
