import {
	AdminSectionHero as JetpackAdminSectionHero,
	Status,
	H3,
	Container,
	Col,
	getIconBySlug,
} from '@automattic/jetpack-components';
import { useConnectionErrorNotice, ConnectionError } from '@automattic/jetpack-connection';
import ScanNavigation from '../scan-navigation';
import SeventyFiveLayout from '../seventy-five-layout';
import styles from './styles.module.scss';

const ConnectionErrorSection = () => {
	const { hasConnectionError } = useConnectionErrorNotice();

	return (
		<Container horizontalSpacing={ 0 }>
			{ hasConnectionError && (
				<Col className={ styles[ 'connection-error-col' ] }>
					<ConnectionError />
				</Col>
			) }
			<Col>
				<div id="jp-admin-notices" className="my-jetpack-jitm-card" />
			</Col>
		</Container>
	);
};

const AdminSectionHero = ( {
	status = null,
	statusLabel,
	showNavigation = false,
	heading = null,
	showIcon = false,
	subheading,
	secondary,
	preserveSecondaryOnMobile = true,
} ) => {
	const Icon = getIconBySlug( 'protect' );

	return (
		<JetpackAdminSectionHero>
			<ConnectionErrorSection />
			<SeventyFiveLayout
				spacing={ 7 }
				main={
					<>
						{ status && <Status status={ status } label={ statusLabel } /> }
						<H3 className={ styles.heading } mt={ 2 } mb={ 2 }>
							{ heading }
							{ showIcon && <Icon className={ styles[ 'heading-icon' ] } size={ 32 } /> }
						</H3>
						{ subheading && <div className={ styles.subheading }>{ subheading }</div> }
						{ showNavigation && <ScanNavigation /> }
					</>
				}
				mainClassName={ styles[ 'header-main' ] }
				secondary={ secondary }
				secondaryClassName={ styles[ 'header-secondary' ] }
				preserveSecondaryOnMobile={ preserveSecondaryOnMobile }
				fluid={ false }
			/>
		</JetpackAdminSectionHero>
	);
};

export default AdminSectionHero;
