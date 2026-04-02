import { Button, Flex, FlexItem, Notice } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { PAID_PLAN_LIMIT } from './constants';

type PaidAtLimitNoticeProps = {
	onDismiss: VoidFunction;
};

/**
 * Notice shown when a paid plan user has reached their monthly X share limit.
 *
 * @param {PaidAtLimitNoticeProps} props - The props for the PaidAtLimitNotice component.
 * @return The at-limit notice UI with feedback and dismiss buttons.
 */
export function PaidAtLimitNotice( { onDismiss }: PaidAtLimitNoticeProps ) {
	return (
		<Notice isDismissible={ false } status="warning">
			<Flex direction="column">
				<FlexItem>
					{ sprintf(
						/* translators: %d: paid plan share limit */
						__(
							"You've used all %d shares to X this month. We'd love to hear how a higher limit would help.",
							'jetpack-publicize-pkg'
						),
						PAID_PLAN_LIMIT
					) }
				</FlexItem>
				<Flex justify="start" gap={ 3 }>
					<Button
						variant="primary"
						className="is-compact"
						href="https://jetpack.com/contact-support/"
						target="_blank"
						rel="noopener noreferrer"
					>
						{ __( 'Share feedback', 'jetpack-publicize-pkg' ) }
					</Button>
					<Button variant="secondary" className="is-compact" onClick={ onDismiss }>
						{ __( 'Not now', 'jetpack-publicize-pkg' ) }
					</Button>
				</Flex>
			</Flex>
		</Notice>
	);
}
