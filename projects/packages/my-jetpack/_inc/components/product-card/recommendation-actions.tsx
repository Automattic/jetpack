import { Button } from '@automattic/jetpack-components';
import clsx from 'clsx';
import styles from './style.module.scss';
import usePricingData from './use-pricing-data';

const RecommendationActions = ( { slug }: { slug: string } ) => {
	const { secondaryAction, purchaseAction, isActivating } = usePricingData( slug );

	return (
		<div className={ styles.actions }>
			<div className={ clsx( styles.buttons, styles.upsell ) }>
				{ purchaseAction && (
					<Button size="small" { ...purchaseAction }>
						{ purchaseAction.label }
					</Button>
				) }
				<Button size="small" variant="secondary" disabled={ isActivating } { ...secondaryAction }>
					{ secondaryAction.label }
				</Button>
			</div>
		</div>
	);
};

export default RecommendationActions;
