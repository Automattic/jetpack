import { __ } from '@wordpress/i18n';
import { type FunctionComponent } from 'react';
import styles from './error-tooltip.module.scss';

interface ErrorTooltipProps {
	errors: string[];
}

export const ErrorTooltip: FunctionComponent< ErrorTooltipProps > = ( { errors } ) => {
	if ( ! errors || errors.length === 0 ) {
		return null;
	}

	return (
		<div className={ styles[ 'jb-error-tooltip' ] }>
			<div className={ styles[ 'jb-error-tooltip__header' ] }>
				{ __( 'Optimization Details', 'jetpack-boost' ) }
			</div>
			<hr />
			<ul>
				{ errors.map( ( error, index ) => (
					<li key={ index } className={ styles[ 'jb-error-tooltip__row' ] }>
						{ error }
					</li>
				) ) }
			</ul>
			<div className={ styles[ 'jb-error-tooltip__pointer' ] }></div>
		</div>
	);
};
