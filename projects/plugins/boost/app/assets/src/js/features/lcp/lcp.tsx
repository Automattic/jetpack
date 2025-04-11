import { __ } from '@wordpress/i18n';
import styles from './lcp.module.scss';
import { Button } from '@automattic/jetpack-components';
import RefreshIcon from '$svg/refresh';
import Module from '$features/module/module';

const Lcp = () => {
	return (
		<Module
			slug="lcp"
			title={ __( 'Optimize LCP', 'jetpack-boost' ) }
			description={
				<p>
					{ __(
						'Improve the largest contentful paint (LCP) of your Cornerstone pages.',
						'jetpack-boost'
					) }
				</p>
			}
		>
			<div className={ styles.status }>
				<div className={ styles.summary }>
					<div className={ styles.successes }>
						{ __( '5 pages optimized 10 minutes ago.', 'jetpack-boost' ) }
					</div>
				</div>
				<Button
					className={ styles[ 'optimize-button' ] }
					variant="link"
					size="small"
					weight="regular"
					icon={ <RefreshIcon /> }
				>
					{ __( 'Optimize', 'jetpack-boost' ) }
				</Button>
			</div>
		</Module>
	);
};

export default Lcp;
