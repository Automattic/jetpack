import { Button, JetpackIcon } from '@automattic/jetpack-components';
import { Popover } from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback, useState } from 'react';
import styles from './style.module.scss';
import './style.global.scss';

/**
 * Golden Token Tooltip.
 *
 * This is a rather quick port of the <IconTooltip> Jetpack component.
 * We created this one because <IconTooltip> is (at the time of writing)
 * hardcoded to only support Grid icons, and we're on a rather tight deadline.
 *
 * @param {object} props - Component properties.
 * @param {string} props.productName - A product/plan name.
 * @param {string} props.giftedDate - The date the product/plan was gifted.
 * @returns {object} - A Golden Token Tooltip.
 */
export function GoldenTokenTooltip( { productName, giftedDate } ) {
	const [ isVisible, setIsVisible ] = useState( false );
	const showTooltip = useCallback( () => setIsVisible( true ), [ setIsVisible ] );
	const hideTooltip = useCallback( () => setIsVisible( false ), [ setIsVisible ] );

	const popoverArgs = {
		position: 'top center',
		placement: 'top',
		animate: true,
		noArrow: false,
		resize: false,
		flip: false,
		offset: 6, // The distance (in px) between the anchor and the popover.
		focusOnMount: 'container',
		onClose: hideTooltip,
		className: styles.container,
	};

	const wrapperClassNames = clsx( styles.wrapper, 'golden-token-icon-tooltip' );

	return (
		<div className={ wrapperClassNames }>
			<Button variant="link" onClick={ showTooltip }>
				<JetpackIcon className={ styles.logo } />
			</Button>

			<div className={ styles.helper }>
				{ isVisible && (
					<Popover { ...popoverArgs }>
						<div>
							<div className={ styles.title }>{ productName }</div>
							<div className={ styles.content }>
								{ sprintf(
									// translators: %1$s is a product name, %2$s is the date the product was gifted.
									__(
										'%1$s was gifted on %2$s. It gives you access to a lifetime subscription of Jetpack VaultPress Backup and Jetpack Scan.',
										'jetpack-my-jetpack'
									),
									productName,
									dateI18n( 'F j, Y', giftedDate )
								) }
							</div>
						</div>
					</Popover>
				) }
			</div>
		</div>
	);
}
