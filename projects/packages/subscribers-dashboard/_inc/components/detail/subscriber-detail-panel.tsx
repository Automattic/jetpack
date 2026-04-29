import { Button, Modal } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { close as closeIcon } from '@wordpress/icons';
import SubscriberDetailContent from './subscriber-detail-content';
import type { OpenSubscriber } from '../../lib/use-open-subscriber';

type Props = {
	open: OpenSubscriber;
	onClose: () => void;
};

/**
 * Subscriber detail surface — mirrors Forms' inspector pattern: an inline flex sibling on
 * desktop (table shrinks to make room) and a `Modal` on mobile. Same body content in both,
 * delegated to `SubscriberDetailContent`.
 *
 * @param props         - Component props.
 * @param props.open    - Current open-subscriber identifiers (null when closed).
 * @param props.onClose - Close handler.
 * @return Inline inspector, mobile modal, or null when closed.
 */
export default function SubscriberDetailPanel( { open, onClose }: Props ): JSX.Element | null {
	const isMobileViewport = useViewportMatch( 'medium', '<' );

	useEffect( () => {
		if ( ! open || isMobileViewport ) {
			return;
		}
		const onKey = ( event: KeyboardEvent ) => {
			if ( event.key === 'Escape' ) {
				onClose();
			}
		};
		window.addEventListener( 'keydown', onKey );
		return () => window.removeEventListener( 'keydown', onKey );
	}, [ open, isMobileViewport, onClose ] );

	if ( ! open ) {
		return null;
	}

	if ( isMobileViewport ) {
		return (
			<Modal
				title={ __( 'Subscriber details', 'jetpack-subscribers-dashboard' ) }
				onRequestClose={ onClose }
				className="jetpack-subscribers-dashboard__detail-modal"
			>
				<SubscriberDetailContent open={ open } />
			</Modal>
		);
	}

	return (
		<aside
			className="jetpack-subscribers-dashboard__surface is-inspector"
			aria-label={ __( 'Subscriber details', 'jetpack-subscribers-dashboard' ) }
		>
			<div className="jetpack-subscribers-dashboard__panel-header">
				<h2 className="jetpack-subscribers-dashboard__panel-title">
					{ __( 'Subscriber details', 'jetpack-subscribers-dashboard' ) }
				</h2>
				<Button
					icon={ closeIcon }
					label={ __( 'Close', 'jetpack-subscribers-dashboard' ) }
					onClick={ onClose }
				/>
			</div>
			<div className="jetpack-subscribers-dashboard__panel-body">
				<SubscriberDetailContent open={ open } />
			</div>
		</aside>
	);
}
