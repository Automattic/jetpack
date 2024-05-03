import { Button, useBreakpointMatch } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Icon, chevronLeft } from '@wordpress/icons';
import classNames from 'classnames';
import { Connection } from '../constants';
import styles from './style.module.scss';

type ConnectPageProps = {
	service: Connection;
	onBackClicked: () => void;
};

export const ConnectPage: React.FC< ConnectPageProps > = ( { service, onBackClicked } ) => {
	const [ isSmall ] = useBreakpointMatch( 'sm' );

	return (
		<>
			<div
				className={ classNames( styles[ 'example-wrapper' ], {
					[ styles.small ]: isSmall,
				} ) }
			>
				{ service.examples.map( ( Example, idx ) => (
					<div key={ service.name + idx } className={ styles.example }>
						<Example />
					</div>
				) ) }
			</div>
			<div className={ styles[ 'actions-wrapper' ] }>
				<Button variant="secondary" onClick={ onBackClicked }>
					{ <Icon icon={ chevronLeft } className={ styles[ 'chevron-back' ] } /> }
				</Button>
				<Button variant="primary">{ __( 'Connect', 'jetpack' ) }</Button>
			</div>
		</>
	);
};
