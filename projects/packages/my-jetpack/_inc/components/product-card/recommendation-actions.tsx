import { Button } from '@automattic/jetpack-components';
import clsx from 'clsx';
import styles from './style.module.scss';
import usePricingData from './use-pricing-data';

const RecommendationActions = ( { slug }: { slug: string } ) => {
	const { secondaryAction, primaryAction, isFeature, isActivating, isInstalling } =
		usePricingData( slug );

	return (
		<div className={ styles.actions }>
			<div className={ clsx( styles.buttons, styles.upsell ) }>
				{ primaryAction && (
					<Button
						size="small"
						disabled={ isFeature && ( isActivating || isInstalling ) }
						{ ...primaryAction }
					>
						{ primaryAction.label }
					</Button>
				) }
				{ secondaryAction && (
					<Button size="small" variant="secondary" disabled={ isActivating } { ...secondaryAction }>
						{ secondaryAction.label }
					</Button>
				) }
			</div>
		</div>
	);
};

export default RecommendationActions;
