import { useCallback } from '@wordpress/element';
import { _n, sprintf, __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Notice } from '@wordpress/ui';
import { logStatusHref } from '../../../data/log-link';
import { periodPhrase } from '../../../data/period';
import type { Attention } from './dashboard-state';
import type { Period } from '../../../data/types';

type Props = {
	attention: NonNullable< Attention >;
	/** The period the counts are for. */
	period: Period;
};

/**
 * The link's label: all of them, or only the ones the log still keeps.
 *
 * @param attention - The emails counted.
 * @return The label, or '' when none are left in the log.
 */
function linkLabel( attention: NonNullable< Attention > ): string {
	const { kind, count, inLog } = attention;
	if ( inLog <= 0 ) {
		return '';
	}
	if ( inLog < count ) {
		return sprintf(
			/* translators: %d: how many of the emails are still in the log. */
			_n(
				'See the %d still in your log',
				'See the %d still in your log',
				inLog,
				'jetpack-send-pkg'
			),
			inLog
		);
	}
	return kind === 'failed'
		? _n( 'See it in the Log', 'See them in the Log', count, 'jetpack-send-pkg' )
		: __( 'See which', 'jetpack-send-pkg' );
}

/**
 * One notice for emails that didn't go out through Send in the period, from the same counts as the
 * metric tabs, with a link to the ones the log still keeps.
 *
 * @param props           - Component props.
 * @param props.attention - The failed or host-sent emails to count.
 * @param props.period    - The period they're counted in.
 * @return The notice.
 */
const AttentionNotice = ( { attention, period }: Props ) => {
	const navigate = useNavigate();
	const failed = attention.kind === 'failed';
	// The rows the count still has in the log: site emails and resends, in the same days.
	const open = useCallback(
		() =>
			navigate( {
				href: logStatusHref( failed ? 'failed' : 'fallback', {
					source: [ 'wp_mail', 'resend' ],
					period,
				} ),
			} ),
		[ navigate, failed, period ]
	);

	const text = failed
		? sprintf(
				/* translators: 1: number of emails, 2: the period, e.g. "in the last 90 days". */
				_n(
					'%1$d email didn’t send %2$s.',
					'%1$d emails didn’t send %2$s.',
					attention.count,
					'jetpack-send-pkg'
				),
				attention.count,
				periodPhrase( period )
			)
		: sprintf(
				/* translators: 1: number of emails, 2: the period, e.g. "in the last 90 days". */
				_n(
					'Jetpack Send couldn’t send %1$d email %2$s, so your host sent it.',
					'Jetpack Send couldn’t send %1$d emails %2$s, so your host sent them.',
					attention.count,
					'jetpack-send-pkg'
				),
				attention.count,
				periodPhrase( period )
			);
	const label = linkLabel( attention );
	const gone = label
		? ''
		: _n(
				'It isn’t in your log anymore.',
				'None of them are in your log anymore.',
				attention.count,
				'jetpack-send-pkg'
			);

	return (
		<Notice.Root intent={ failed ? 'warning' : 'info' }>
			<Notice.Description>{ gone ? `${ text } ${ gone }` : text }</Notice.Description>
			{ label && (
				<Notice.Actions>
					{ /* A status note, so a light action rather than the page's heaviest button. */ }
					<Notice.ActionButton variant="outline" onClick={ open }>
						{ label }
					</Notice.ActionButton>
				</Notice.Actions>
			) }
		</Notice.Root>
	);
};

export default AttentionNotice;
