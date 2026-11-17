/**
 * Internal dependencies
 */
import { assetUrl } from '../../asset-url';
import styles from './upgrade-page.module.scss';
import type { JSX } from 'react';

// Intrinsic sizes, so the stack holds its height while the images load.
const SHOTS = [
	{ path: 'upgrade/images/shot-1.webp', width: 1000, height: 683 },
	{ path: 'upgrade/images/shot-2.webp', width: 1000, height: 618 },
	{ path: 'upgrade/images/shot-3.webp', width: 1000, height: 605 },
	{ path: 'upgrade/images/shot-4.webp', width: 1000, height: 292 },
];

/**
 * The dashboard screenshots beside the pitch, overlapping as one stack.
 *
 * @return The showcase.
 */
export function Showcase(): JSX.Element {
	return (
		<div className={ styles.showcase } aria-hidden="true">
			<div className={ styles.shots }>
				{ SHOTS.map( ( { path, width, height } ) => {
					const src = assetUrl( path );
					return src ? (
						<img
							key={ path }
							src={ src }
							width={ width }
							height={ height }
							alt=""
							className={ styles.shot }
						/>
					) : null;
				} ) }
			</div>
		</div>
	);
}
