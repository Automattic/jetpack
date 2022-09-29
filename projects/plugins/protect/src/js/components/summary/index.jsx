import { Container, Col, Text, Title, getIconBySlug } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import React from 'react';
import useProtectData from '../../hooks/use-protect-data';
import { STORE_ID } from '../../state/store';
import Notice from '../notice';
import styles from './styles.module.scss';

const Summary = () => {
	const { numThreats, lastChecked } = useProtectData();
	const notice = useSelect( select => select( STORE_ID ).getNotice() );
	const Icon = getIconBySlug( 'protect' );

	return (
		<Container fluid>
			<Col>
				<div className={ styles.summary }>
					<div>
						<Title size="small" className={ styles.summary__title }>
							<Icon size={ 32 } className={ styles.summary__icon } />
							{ sprintf(
								/* translators: %s: Latest check date  */
								__( 'Latest results as of %s', 'jetpack-protect' ),
								dateI18n( 'F jS', lastChecked )
							) }
						</Title>
						{ numThreats > 0 && (
							<Text variant="headline-small" component="h1">
								{ sprintf(
									/* translators: %s: Total number of threats  */
									__( '%s threats found', 'jetpack-protect' ),
									numThreats
								) }
							</Text>
						) }
					</div>
					<div>{ notice && <Notice message={ notice } /> }</div>
				</div>
			</Col>
		</Container>
	);
};

export default Summary;
