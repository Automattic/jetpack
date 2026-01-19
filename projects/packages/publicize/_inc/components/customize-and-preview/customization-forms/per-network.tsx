import { Flex } from '@wordpress/components';
import { Connection } from '../../../social-store/types';
import { SharePostForm } from '../../form/share-post-form';
import { ConnectionToggle } from '../connection-toggle';

type PerNetworkCustomizationFormProps = {
	connection: Connection;
};

/**
 * Per-Network Customization Form component.
 *
 * @param {PerNetworkCustomizationFormProps} props - The component props.
 * @return - Per-Network Customization Form component.
 */
export function PerNetworkCustomizationForm( { connection }: PerNetworkCustomizationFormProps ) {
	return (
		<Flex direction="column" gap={ 8 } justify="start">
			<ConnectionToggle connection={ connection } />
			<SharePostForm
				// TODO Wire up per-network customization state to the form.
				analyticsData={ { location: 'preview-modal' } }
				isInsideNavigatorModal
				disabled={ ! connection.enabled }
			/>
		</Flex>
	);
}
