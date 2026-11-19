import { Button, ButtonLink } from '@wordpress/ui';
import clsx from 'clsx';
import styles from './style.module.scss';
import usePricingData from './use-pricing-data';

type ActionProps = {
	action: { label: string; href?: string; onClick?: () => void };
	variant?: 'outline';
	disabled: boolean;
};

// An action that goes somewhere renders as a link: a button ignores `href`.
const Action = ( { action: { label, href, onClick }, variant, disabled }: ActionProps ) =>
	href ? (
		<ButtonLink size="small" variant={ variant } href={ href } onClick={ onClick }>
			{ label }
		</ButtonLink>
	) : (
		<Button size="small" variant={ variant } disabled={ disabled } onClick={ onClick }>
			{ label }
		</Button>
	);

const RecommendationActions = ( { slug }: { slug: string } ) => {
	const { secondaryAction, primaryAction, isFeature, isActivating, isInstalling } =
		usePricingData( slug );

	return (
		<div className={ styles.actions }>
			<div className={ clsx( styles.buttons, styles.upsell ) }>
				{ primaryAction && (
					<Action
						action={ primaryAction }
						disabled={ isFeature && ( isActivating || isInstalling ) }
					/>
				) }
				{ secondaryAction && (
					<Action action={ secondaryAction } variant="outline" disabled={ isActivating } />
				) }
			</div>
		</div>
	);
};

export default RecommendationActions;
