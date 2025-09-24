/**
 * WordPress dependencies
 */
import { store as commandsStore } from '@wordpress/commands';
import {
	Button,
	__experimentalText as Text,
	__unstableMotion as motion,
	Icon,
} from '@wordpress/components';
import { useReducedMotion } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { displayShortcut } from '@wordpress/keycodes';
// @ts-expect-error Commands package is not typed yet.

/**
 * Internal dependencies
 */
import './style.scss';

/**
 *
 * @param root0
 * @param root0.icon
 * @param root0.title
 */
export default function DocumentBar( {
	icon,
	title,
}: {
	icon: React.ReactElement< React.ComponentProps< 'svg' > >;
	title: string;
} ) {
	const { open: openCommandCenter } = useDispatch( commandsStore );
	const isReducedMotion = useReducedMotion();

	const mountedRef = useRef( false );
	useEffect( () => {
		mountedRef.current = true;
	}, [] );

	return (
		<div className="next-admin-media-editor-document-bar">
			{ icon && (
				<span className="next-admin-media-editor-document-bar__icon-layout">
					<Icon icon={ icon } />
				</span>
			) }
			<Button
				className="next-admin-media-editor-document-bar__command"
				onClick={ () => openCommandCenter() }
				size="compact"
			>
				<motion.div
					className="next-admin-media-editor-document-bar__title"
					// Force entry animation when the back button is added or removed.
					initial={
						mountedRef.current
							? {
									opacity: 0,
									transform: 'translateX(-15%)',
							  }
							: false // Don't show entry animation when DocumentBar mounts.
					}
					animate={ {
						opacity: 1,
						transform: 'translateX(0%)',
					} }
					transition={ isReducedMotion ? { duration: 0 } : undefined }
				>
					<Text size="body" as="h1">
						<span className="next-admin-media-editor-document-bar__post-title">
							{ title ? stripHTML( title ) : __( 'No title', 'jetpack-media-editor' ) }
						</span>
					</Text>
				</motion.div>
				<span className="next-admin-media-editor-document-bar__shortcut">
					{ displayShortcut.primary( 'k' ) }
				</span>
			</Button>
		</div>
	);
}
