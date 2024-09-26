import { Container, Col, Text, getIconBySlug } from '@automattic/jetpack-components';
import React from 'react';
import styles from './styles.module.scss';

type Props = {
	title?: string | React.ReactNode;
	subtitle?: string | React.ReactNode;
};

const ScanSectionHeader = ( { title, subtitle }: Props ) => {
	const Icon = getIconBySlug( 'protect' );

	return (
		<Container fluid>
			<Col>
				<div className={ styles[ 'scan-section-header' ] }>
					<div className={ styles[ 'scan-section-header__content' ] }>
						{ title && (
							<Text
								variant="headline-small"
								component="h1"
								className={ styles[ 'scan-section-header__title' ] }
							>
								{ title }
								<Icon size={ 32 } className={ styles[ 'scan-section-header__icon' ] } />
							</Text>
						) }
						{ subtitle && (
							<Text size="small" className={ styles[ 'scan-section-header__subtitle' ] }>
								{ subtitle }
							</Text>
						) }
					</div>
				</div>
			</Col>
		</Container>
	);
};

export default ScanSectionHeader;
