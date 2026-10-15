import { EarnPage } from '../../src/features/wpcom-earn/js/page.tsx';
import { Placeholder } from '../../src/features/wpcom-earn/js/placeholder.tsx';

const Stage = () => {
	return (
		<EarnPage active="payments">
			<Placeholder section="payments" />
		</EarnPage>
	);
};

export { Stage as stage };
