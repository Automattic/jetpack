import { Status, Text } from '@automattic/jetpack-components';
import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from 'react';
// import { useParams } from 'react-router-dom';
import AdminSectionHero from '../../../components/admin-section-hero';
import ErrorAdminSectionHero from '../../../components/error-admin-section-hero';
import ScanNavigation from '../../../components/scan-navigation';
import useHistoryQuery from '../../../data/scan/use-history-query';
import styles from './styles.module.scss';

const HistoryAdminSectionHero: React.FC = () => {
	// const { filter = 'all' } = useParams(); // to do: apply filter to history query
	const { data: history } = useHistoryQuery();

	const numAllThreats = history ? history.threats.length : 0;

	const oldestFirstDetected = useMemo( () => {
		if ( ! history || ! history.threats.length ) {
			return null;
		}

		return history.threats.reduce( ( oldest, current ) => {
			return new Date( current.firstDetected ) < new Date( oldest.firstDetected )
				? current
				: oldest;
		} ).firstDetected;
	}, [ history ] );

	if ( history && history.error ) {
		return (
			<ErrorAdminSectionHero
				baseErrorMessage={ __( 'We are having problems loading your history.', 'jetpack-protect' ) }
				errorMessage={ history.errorMessage }
				errorCode={ history.errorCode }
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
