import { __ } from '@wordpress/i18n';
import { Icon, arrowLeft } from '@wordpress/icons';
import { Link } from '@wordpress/route';
import { Card, Stack, Text } from '@wordpress/ui';
import DashboardLayout from '../dashboard-layout';

type Props = {
	/**
	 * Block class the calling screen uses for its own layout — `jpb-restore`
	 * or `jpb-download`. The card borrows the screen's width, padding and
	 * back-link styles rather than defining its own.
	 */
	prefix: string;
	title: string;
	body: string;
};

/**
 * Shown in place of the restore or download form when the rewind id in
 * the URL isn't one.
 *
 * A malformed id can only produce a failed operation, so the screen
 * offers the way back and nothing else — no checklist, and above all no
 * submit button. Both screens rendered a fully armed form here, with the
 * only sign of trouble being a missing "Restore point:" line.
 *
 * Shared rather than duplicated because the two screens are twins: they
 * differ in the block class and in two strings.
 *
 * @param props        - Component props.
 * @param props.prefix - Block class of the calling screen.
 * @param props.title  - What is wrong, in the reader's terms.
 * @param props.body   - What to do about it.
 * @return The rendered fallback.
 */
export default function InvalidRewindId( { prefix, title, body }: Props ) {
	return (
		<DashboardLayout>
			<div className={ prefix }>
				<Link to="/" className={ `${ prefix }__back` }>
					<Icon icon={ arrowLeft } size={ 18 } />
					{ __( 'Back to overview', 'jetpack-backup-pkg' ) }
				</Link>
				<Card.Root className={ `${ prefix }__card` }>
					<Stack direction="column" gap="xs">
						<Text variant="heading-md" render={ <h3 /> }>
							{ title }
						</Text>
						<Text variant="body-sm" className="jpb-text-muted">
							{ body }
						</Text>
					</Stack>
				</Card.Root>
			</div>
		</DashboardLayout>
	);
}
