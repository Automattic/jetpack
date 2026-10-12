import { Home } from '../../src/features/wpcom-earn/js/home/index.tsx';
import { EarnPage } from '../../src/features/wpcom-earn/js/page.tsx';
import { EarnQueryClientProvider } from '../../src/features/wpcom-earn/js/query-client.tsx';

const Stage = () => {
	return (
		<EarnQueryClientProvider>
			<EarnPage active="home">
				<Home />
			</EarnPage>
		</EarnQueryClientProvider>
	);
};

export { Stage as stage };
