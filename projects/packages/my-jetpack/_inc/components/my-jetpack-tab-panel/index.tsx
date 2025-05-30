import { Container, Col } from '@automattic/jetpack-components';
import { TabPanel } from '@wordpress/components';
import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MY_JETPACK_SECTION_OVERVIEW } from './constants';
import styles from './styles.module.scss';
import { TabContent } from './tab-content';
import { MyJetpackSection } from './types';
import { getMyJetpackSections, isValidMyJetpackSection } from './utils';

/**
 * My Jetpack Tab panel component.
 *
 * @return The rendered component.
 */
export function MyJetpackTabPanel() {
	const params = useParams();
	const navigate = useNavigate();

	const onTabSelect = useCallback(
		( tabName: string ) => {
			if ( tabName !== params.section ) {
				navigate( `/${ tabName }` );
			}
		},
		[ navigate, params.section ]
	);

	const tabRenderer = useCallback( ( tab: { name: MyJetpackSection } ) => {
		return (
			<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
				<Col>
					<TabContent name={ tab.name } />
				</Col>
			</Container>
		);
	}, [] );

	// If the tab is not valid, use the default one.
	const initialTab = isValidMyJetpackSection( params.section )
		? params.section
		: MY_JETPACK_SECTION_OVERVIEW;

	return (
		<TabPanel
			key={ initialTab }
			className={ styles[ 'tab-panel' ] }
			initialTabName={ initialTab }
			onSelect={ onTabSelect }
			children={ tabRenderer }
			tabs={ getMyJetpackSections() }
		/>
	);
}
