import { Status, Text } from '@automattic/jetpack-components';
import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import AdminSectionHero from '../../../components/admin-section-hero';
import ErrorAdminSectionHero from '../../../components/error-admin-section-hero';
import ScanNavigation from '../../../components/scan-navigation';
import useThreatsList from '../../../components/threats-list/use-threats-list';
import useProtectData from '../../../hooks/use-protect-data';
import styles from './styles.module.scss';

const HistoryAdminSectionHero: React.FC = () => {
	const { filter = 'all' } = useParams();
	const { list } = useThreatsList( {
		source: 'history',
		status: filter,
	} );
	const { counts, error } = useProtectData( {
		sourceType: 'history',
		filter: { status: filter },
	} );
	const { threats: numAllThreats } = counts.all;

	const oldestFirstDetected = useMemo( () => {
		if ( ! list.length ) {
			return null;
		}

		return list.reduce( ( oldest, current ) => {
			return new Date( current.firstDetected ) < new Date( oldest.firstDetected )
				? current
				: oldest;
		} ).firstDetected;
	}, [ list ] );

	if ( error ) {
		return (
			<ErrorAdminSectionHero
				baseErrorMessage={ __( 'We are having problems loading your history.', 'jetpack-protect' ) }
				errorMessage={ error?.message }
				errorCode={ error?.code }
			/>
		);
	}

	return (
		<AdminSectionHero
			main={
				<>
					<Status status="active" label={ __( 'Active', 'jetpack-protect' ) } />
					<AdminSectionHero.Heading showIcon>
						{ numAllThreats > 0
							? sprintf(
									/* translators: %s: Total number of threats  */
									__( '%1$s previously active %2$s', 'jetpack-protect' ),
									numAllThreats,
									numAllThreats === 1 ? 'threat' : 'threats'
							  )
							: __( 'No previously active threats', 'jetpack-protect' ) }
					</AdminSectionHero.Heading>
					<AdminSectionHero.Subheading>
						<Text>
							{ oldestFirstDetected ? (
								<span className={ styles[ 'subheading-content' ] }>
									{ sprintf(
										/* translators: %s: Oldest first detected date */
										__( '%s - Today', 'jetpack-protect' ),
										dateI18n( 'F jS g:i A', oldestFirstDetected, false )
									) }
								</span>
							) : (
								__( 'Most recent results', 'jetpack-protect' )
							) }
						</Text>
					</AdminSectionHero.Subheading>
					<div className={ styles[ 'scan-navigation' ] }>
						<ScanNavigation />
					</div>
				</>
			}
		/>
	);
};

export default HistoryAdminSectionHero;
