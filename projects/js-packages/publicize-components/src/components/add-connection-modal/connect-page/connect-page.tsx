import { Button, useBreakpointMatch } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import { ConnectForm } from '../connect-form';
import styles from './style.module.scss';
import type { SupportedService } from '../use-supported-services';

type ConnectPageProps = {
	service: SupportedService;
	onBackClicked: VoidFunction;
	onConfirm: ( data: unknown ) => void;
};

export const ConnectPage: React.FC< ConnectPageProps > = ( {
	service,
	onBackClicked,
	onConfirm,
} ) => {
	const [ isSmall ] = useBreakpointMatch( 'sm' );

	return (
		<>
			<div
				className={ classNames( styles[ 'example-wrapper' ], {
					[ styles.small ]: isSmall,
				} ) }
			>
				{ service.examples.map( ( Example, idx ) => (
					<div key={ service.ID + idx } className={ styles.example }>
						<Example />
					</div>
				) ) }
			</div>
			<div className={ styles[ 'actions-wrapper' ] }>
				<Button
					variant="secondary"
					onClick={ onBackClicked }
					aria-label={ __( 'Go back', 'jetpack' ) }
				>
					{ __( 'Back', 'jetpack' ) }
				</Button>
				<ConnectForm
					service={ service }
					isSmall={ isSmall }
					onConfirm={ onConfirm }
					displayInputs
				/>
			</div>
		</>
	);
};
