import './style.css';
import prototype from './prototype';
import { load } from './Images';

prototype();

document.addEventListener('DOMContentLoaded', async () => {
	const nodes = document.querySelectorAll('body *');

	const images = await load(Array.from(nodes));


	console.log(images)
});
