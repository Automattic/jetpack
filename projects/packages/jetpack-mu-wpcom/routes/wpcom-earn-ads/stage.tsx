import { EarnPage } from '../../src/features/wpcom-earn/js/page.tsx';
import { Placeholder } from '../../src/features/wpcom-earn/js/placeholder.tsx';
import { EarnQueryClientProvider } from '../../src/features/wpcom-earn/js/query-client.tsx';

const Stage = () => {
	return (
		<EarnQueryClientProvider>
			<EarnPage active="ads">
				<Placeholder section="ads" />
			</EarnPage>
		</EarnQueryClientProvider>
	);
};

export { Stage as stage };
