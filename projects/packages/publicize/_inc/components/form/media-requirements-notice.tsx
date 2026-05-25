import { getRedirectUrl } from '@automattic/jetpack-components';
import { Notice } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { Fragment, useMemo } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { getErrorLabel } from '../../hooks/use-media-restrictions/constants';
import { ValidationErrors } from '../../hooks/use-media-restrictions/types';
import { store as socialStore } from '../../social-store';
import { useServiceLabel } from '../services/use-service-label';
import type { FC } from 'react';

export type MediaRequirementsNoticeProps = {
	validationErrors: ValidationErrors;
};

export const MediaRequirementsNotice: FC< MediaRequirementsNoticeProps > = ( {
	validationErrors,
} ) => {
	const { getConnectionById } = useSelect( select => select( socialStore ), [] );

	const getServiceLabel = useServiceLabel();

	const errorTypesToServicesMap = useMemo( () => {
		return Object.entries( validationErrors ).reduce< Record< string, Array< string > > >(
			( map, [ connectionId, errorType ] ) => {
				if ( ! errorType ) {
					return map;
				}

				if ( ! map[ errorType ] ) {
					map[ errorType ] = [];
				}

				const label = getServiceLabel( getConnectionById( connectionId )?.service_name );

				if ( label && ! map[ errorType ].includes( label ) ) {
					map[ errorType ].push( label );
				}

				return map;
			},
			{}
		);
	}, [ getConnectionById, getServiceLabel, validationErrors ] );

	return (
		<Notice status="warning" isDismissible={ false }>
			<p>
				{ __(
					'The selected media cannot be shared to some social media platforms.',
					'jetpack-publicize-pkg'
				) }
			</p>
			<ul>
				{ /* Let us be a little more helpful and help them by listing the services that need attention */ }
				{ Object.entries( errorTypesToServicesMap ).map( ( [ errorType, services ] ) => {
					if ( ! services.length ) {
						return null;
					}

					return (
						<li key={ errorType }>
							<i>{ getErrorLabel( errorType ) }</i>
							{ _x(
								':',
								'Colon to display before the list of social media platforms',
								'jetpack-publicize-pkg'
							) + ' ' }
							{
								// Since Intl.ListFormat is not allowed in Jetpack yet,
								// we join the strings with a comma and space
								services.map( ( label, i, { length } ) => (
									<Fragment key={ label }>
										<b>{ label }</b>
										{ i < length - 1 &&
											_x(
												',',
												'Comma to separate list of social media platforms',
												'jetpack-publicize-pkg'
											) + ' ' }
									</Fragment>
								) )
							}
						</li>
					);
				} ) }
			</ul>
			<Link openInNewTab href={ getRedirectUrl( 'jetpack-social-media-support-information' ) }>
				{ __( 'Troubleshooting tips', 'jetpack-publicize-pkg' ) }
			</Link>
		</Notice>
	);
};
