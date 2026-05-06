import { Animate } from '@wordpress/components';
import clsx from 'clsx';

import './style.scss';

type MessageSkeletonProps = {
	lines?: number;
	className?: string;
};

/**
 * Renders pulsing placeholder bars for preview message text.
 *
 * @param {MessageSkeletonProps} props - Component props.
 * @return The skeleton placeholder.
 */
export function MessageSkeleton( props: MessageSkeletonProps ) {
	const { lines = 2, className } = props;
	const lineCount = Math.max( 1, lines );

	return (
		<Animate type="loading">
			{ ( { className: animationClassName } ) => (
				<div
					className={ clsx( 'social-preview__message-skeleton', animationClassName, className ) }
				>
					{ Array.from( { length: lineCount } ).map( ( _, index ) => {
						const isTrailingBar = lineCount > 1 && index === lineCount - 1;

						return (
							<div
								key={ `social-preview__message-skeleton__bar-${ index }` }
								className={ clsx(
									'social-preview__message-skeleton__bar',
									isTrailingBar && 'social-preview__message-skeleton__bar--short'
								) }
							/>
						);
					} ) }
				</div>
			) }
		</Animate>
	);
}
