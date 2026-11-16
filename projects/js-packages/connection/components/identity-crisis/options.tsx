import { _x } from '@wordpress/i18n';
import { Children, Fragment } from 'react';
import styles from './styles.module.scss';
import type { IdentityCrisisOptionsProps } from './types';
import type { ReactNode } from 'react';

/**
 * Options side by side with "or" between them, stacked when their container is narrow.
 *
 * @param {IdentityCrisisOptionsProps} props - Component props.
 * @return {ReactNode} The options.
 */
export default function IdentityCrisisOptions( {
	children,
}: IdentityCrisisOptionsProps ): ReactNode {
	const options = Children.toArray( children );

	return (
		<div className={ styles.options }>
			<div className={ styles[ 'options-row' ] }>
				{ options.map( ( option, index ) => (
					<Fragment key={ index }>
						{ index > 0 && (
							<span className={ styles[ 'options-separator' ] }>
								{ _x( 'or', 'Between two Safe Mode options', 'jetpack-connection-js' ) }
							</span>
						) }
						{ option }
					</Fragment>
				) ) }
			</div>
		</div>
	);
}
