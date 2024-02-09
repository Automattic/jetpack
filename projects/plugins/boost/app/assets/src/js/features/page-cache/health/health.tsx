import { Notice } from '@automattic/jetpack-components';
import { useSingleModuleState } from '$features/module/lib/stores';
import { usePageCacheDiagnosticDS } from '$lib/stores/page-cache';
import { getDiagnosticData } from './lib/diagnostic';

const Health = () => {
	const [ pageCache ] = useSingleModuleState( 'page_cache' );
	const data = usePageCacheDiagnosticDS();

	// If the module is disabled, can it be enabled?
	if ( pageCache?.active !== true && data?.canBeEnabled.status === false ) {
		const diagnosticMessage = getDiagnosticData( data?.canBeEnabled.error );
		if ( diagnosticMessage ) {
			return (
				<Notice level="warning" hideCloseButton={ true } title={ diagnosticMessage.title }>
					{ diagnosticMessage.message }
				</Notice>
			);
		}
	}

	// Don't mind me.
};

export default Health;
