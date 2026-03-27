import { isSimpleSite } from '@automattic/jetpack-script-data';
import { Button, Flex, FlexItem, Notice } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { FREE_PLAN_LIMIT, PAID_PLAN_LIMIT } from './constants';
import { getUpgradeUrl } from './utils';

type AtLimitNoticeProps = {
	onDismiss: VoidFunction;
	onUpgrade: React.MouseEventHandler< HTMLAnchorElement >;
};

/**
 * Notice shown when the user has reached their free plan X share limit.
 *
 * @param {AtLimitNoticeProps} props - The props for the AtLimitNotice component.
 * @return The at-limit notice UI with upgrade and dismiss buttons.
 */
export function AtLimitNotice( { onDismiss, onUpgrade }: AtLimitNoticeProps ) {
	if ( isSimpleSite() ) {
		return null;
	}

	const upgradeUrl = getUpgradeUrl();

	return (
		<Notice isDismissible={ false } status="warning">
			<Flex direction="column">
				<FlexItem>
					{ sprintf(
						/* translators: %1$d: free plan share limit, %2$d: paid plan share limit */
						__(
							"You've used your %1$d free shares to X. Unlock %2$d shares per month with a paid plan.",
							'jetpack-publicize-pkg'
						),
						FREE_PLAN_LIMIT,
						PAID_PLAN_LIMIT
					) }
				</FlexItem>
				<Flex justify="start" gap={ 3 }>
					<Button
						variant="primary"
						className="is-compact"
						href={ upgradeUrl }
						onClick={ onUpgrade }
						target="_blank"
						rel="noopener noreferrer"
					>
						{ __( 'Upgrade plan', 'jetpack-publicize-pkg' ) }
					</Button>
					<Button variant="secondary" className="is-compact" onClick={ onDismiss }>
						{ __( 'Not now', 'jetpack-publicize-pkg' ) }
					</Button>
				</Flex>
			</Flex>
		</Notice>
	);
}
