import { Button, useBreakpointMatch } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import { SupportedService } from '../constants';
import styles from './style.module.scss';

type ConnectPageProps = {
	service: SupportedService;
	onBackClicked: VoidFunction;
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
				<Button
					variant="secondary"
					onClick={ onBackClicked }
					aria-label={ __( 'Go back', 'jetpack' ) }
				>
					{ __( 'Back', 'jetpack' ) }
				</Button>
				<form className={ classNames( styles[ 'connect-form' ], { [ styles.small ]: isSmall } ) }>
					{ 'mastodon' === service.name ? (
						<input
							required
							type="text"
							aria-label={ __( 'Mastodon username', 'jetpack' ) }
							placeholder={ '@mastodon@mastodon.social' }
						/>
					) : null }
					<Button type="submit" variant="primary">
						{ __( 'Connect', 'jetpack' ) }
					</Button>
				</form>
			</div>
		</>
	);
};
