/**
 * External dependencies
 */
import React from 'react';
import {
	AdminSection,
	AdminSectionHero,
	AdminPage,
	Row,
	Grid,
} from '@automattic/jetpack-components';

import './style.scss';

/**
 * The My Jetpack App Main Screen.
 *
 * @returns {object} The MyJetpackScreen component.
 */
export default function MyJetpackScreen() {
	return (
		<div className="jp-my-jetpack-screen">
			<AdminPage>
				<AdminSectionHero>
					<Row>
						<Grid lg={ 12 } md={ 8 } sm={ 4 }>
							Lorem Ipsum
						</Grid>
					</Row>
				</AdminSectionHero>

				<AdminSection>
					<Row>
						<Grid lg={ 12 } md={ 8 } sm={ 4 }>
							Lorem Ipsum
						</Grid>
					</Row>
				</AdminSection>
			</AdminPage>
		</div>
	);
}
