import { Text, Title, getIconBySlug } from '@automattic/jetpack-components';
import React from 'react';
import ScanSectionNavigation from './scan-section-navigation';
import styles from './styles.module.scss';

type Props = {
	title?: string | React.ReactNode;
	subtitle?: string | React.ReactNode;
	controls?: React.ReactNode;
	showNavigation?: boolean;
};

const ScanSectionHeader = ( { title, subtitle, controls, showNavigation = false }: Props ) => {
	const Icon = getIconBySlug( 'protect' );

	return (
		<div className={ styles[ 'scan-section-header' ] }>
			<div className={ styles[ 'scan-section-header__content' ] }>
				{ subtitle && (
					<Title size="small" className={ styles[ 'scan-section-header__subtitle' ] }>
						<Icon size={ 32 } className={ styles[ 'scan-section-header__icon' ] } />
						{ subtitle }
					</Title>
				) }
				{ title && (
					<Text
						variant="headline-small"
						component="h1"
						className={ styles[ 'scan-section-header__title' ] }
					>
						{ title }
					</Text>
				) }
				{ showNavigation ? <ScanSectionNavigation /> : null }
			</div>
			<div className={ styles[ 'scan-section-header__controls' ] }>
				<div className={ styles[ 'scan-section-header__controls__row' ] }>{ controls }</div>
			</div>
		</div>
	);
};

export default ScanSectionHeader;
