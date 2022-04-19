/**
 * External dependencies
 */
import React from 'react';
import { AdminSectionHero, AdminPage, Container, Col } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import GoBackLink from '../go-back-link';
import styles from './styles.module.scss';

/**
 * The AddLicenseScreen component of the My Jetpack app.
 *
 * @returns {object} The AddLicenseScree component.
 */
export default function AddLicenseScreen() {
	return (
		<AdminPage showHeader={ false } showBackground={ false }>
			<AdminSectionHero>
				<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
					<Col>
						<GoBackLink onClick={ null } />
					</Col>
					<Col>
						<Container
							className={ styles.container }
							horizontalSpacing={ 0 }
							horizontalGap={ 0 }
							fluid
						>
							Hello world
						</Container>
					</Col>
				</Container>
			</AdminSectionHero>
		</AdminPage>
	);
}
