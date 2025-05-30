import { getRedirectUrl } from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { FullWidthSeparator } from '../full-width-separator';
import { HelpCards } from './cards';
import { HelpFooter } from './footer';
import styles from './styles.module.scss';

/**
 * The Help content component.
 *
 * @return The rendered component.
 */
export function HelpContent() {
	return (
		<div className={ styles.content }>
			<h2>{ __( 'Need assistance?', 'jetpack-my-jetpack' ) }</h2>
			<p className={ styles.description }>
				{ __(
					'Browse our expert guides to get help with setup, features, and troubleshooting.',
					'jetpack-my-jetpack'
				) }
			</p>
			<Button
				variant="primary"
				href={ getRedirectUrl( 'jetpack-support' ) }
				target="_blank"
				rel="noopener noreferrer"
				className={ styles.cta }
			>
				<span>
					{ __( 'Explore our Help Center', 'jetpack-my-jetpack' ) }
					<span role="presentation" aria-hidden="true">
						&nbsp;
						{ '↗' }
					</span>
				</span>
			</Button>
			<HelpCards />
			<FullWidthSeparator />
			<HelpFooter />
		</div>
	);
}
