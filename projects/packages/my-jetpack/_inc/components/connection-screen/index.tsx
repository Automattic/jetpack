import { AdminPage } from '@automattic/jetpack-components';
import { getUserConnectionUrl } from '@automattic/jetpack-connection';
import { Flex, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect, type FC } from 'react';
import styles from './styles.module.scss';

const ConnectionScreen: FC = () => {
	useEffect( () => {
		window.location.replace( getUserConnectionUrl() );
	}, [] );

	return (
		<AdminPage showBackground={ false } showFooter={ false }>
			<div className={ styles[ 'redirect-block' ] }>
				<Flex justify="start">
					<Spinner style={ { margin: 0 } } />
					{ __( 'Redirecting…', 'jetpack-my-jetpack' ) }
				</Flex>
			</div>
		</AdminPage>
	);
};

export default ConnectionScreen;
