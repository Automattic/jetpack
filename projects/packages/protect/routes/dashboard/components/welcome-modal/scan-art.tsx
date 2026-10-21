import { __ } from '@wordpress/i18n';
import { Icon, check, color, plugins, shield, wordpress } from '@wordpress/icons';
import './scan-art.scss';
import type { CSSProperties, ReactElement } from 'react';

export const SCAN_ART_VARIANTS = [ 'checklist', 'radar', 'trio', 'fixed', 'icon' ] as const;
export type ScanArtVariant = ( typeof SCAN_ART_VARIANTS )[ number ];

/**
 * What a scan checks, with the icons the threat list uses for each.
 *
 * @return Icon and label per scanned thing.
 */
const getTargets = () => [
	// "WordPress" is a product name and is not translated.
	{ icon: wordpress, label: 'WordPress' },
	{ icon: plugins, label: __( 'Plugins', 'jetpack-protect-pkg' ) },
	{ icon: color, label: __( 'Themes', 'jetpack-protect-pkg' ) },
];

const indexStyle = ( i: number ) => ( { '--i': i } ) as CSSProperties;

const CheckBadge = () => (
	<span className="jp-protect-scan-art__check">
		<Icon icon={ check } size={ 16 } />
	</span>
);

/**
 * Header art for the guide's Scan page; `variant` picks one of the explorations.
 *
 * @param props         - Component props.
 * @param props.variant - Which exploration to draw.
 * @return The art.
 */
export default function ScanArt( { variant }: { variant: ScanArtVariant } ): ReactElement {
	if ( variant === 'radar' ) {
		return (
			<span className="jp-protect-scan-art jp-protect-scan-art--radar">
				<span className="jp-protect-scan-art__ring" />
				<span className="jp-protect-scan-art__ring is-inner" />
				<span className="jp-protect-scan-art__sweep" />
				{ getTargets().map( ( target, i ) => (
					<span
						key={ target.label }
						className="jp-protect-scan-art__blip"
						style={ indexStyle( i ) }
					>
						<Icon icon={ target.icon } size={ 20 } />
					</span>
				) ) }
				<span className="jp-protect-welcome__art-badge is-small">
					<Icon icon={ shield } size={ 32 } />
				</span>
			</span>
		);
	}

	if ( variant === 'trio' ) {
		return (
			<span className="jp-protect-scan-art jp-protect-scan-art--trio">
				<span className="jp-protect-scan-art__light" />
				{ getTargets().map( ( target, i ) => (
					<span
						key={ target.label }
						className="jp-protect-welcome__art-badge is-small"
						style={ indexStyle( i ) }
					>
						<Icon icon={ target.icon } size={ 32 } />
						<CheckBadge />
					</span>
				) ) }
			</span>
		);
	}

	if ( variant === 'fixed' ) {
		return (
			<span className="jp-protect-scan-art jp-protect-scan-art--fixed">
				<span className="jp-protect-scan-art__card">
					<span className="jp-protect-scan-art__row">
						<Icon icon={ plugins } size={ 24 } />
						<span className="jp-protect-scan-art__label">
							<strong>{ __( 'Contact Form Plus', 'jetpack-protect-pkg' ) }</strong>
							<span>{ __( 'Version 2.1.4', 'jetpack-protect-pkg' ) }</span>
						</span>
						<span className="jp-protect-scan-art__status">
							<span className="jp-protect-scan-art__pill is-bad">
								{ __( 'Vulnerable', 'jetpack-protect-pkg' ) }
							</span>
							<span className="jp-protect-scan-art__pill is-good">
								{ __( 'Fixed', 'jetpack-protect-pkg' ) }
							</span>
						</span>
					</span>
					<span className="jp-protect-scan-art__fix-bar" />
				</span>
			</span>
		);
	}

	if ( variant === 'icon' ) {
		return (
			<span className="jp-protect-welcome__art-badge">
				<Icon icon={ shield } size={ 64 } />
			</span>
		);
	}

	return (
		<span className="jp-protect-scan-art jp-protect-scan-art--checklist">
			<span className="jp-protect-scan-art__card">
				<span className="jp-protect-scan-art__scanline" />
				{ getTargets().map( ( target, i ) => (
					<span key={ target.label } className="jp-protect-scan-art__row" style={ indexStyle( i ) }>
						<Icon icon={ target.icon } size={ 24 } />
						<span className="jp-protect-scan-art__label">
							<strong>{ target.label }</strong>
						</span>
						<span className="jp-protect-scan-art__status">
							<span className="jp-protect-scan-art__pending" />
							<CheckBadge />
						</span>
					</span>
				) ) }
			</span>
		</span>
	);
}
