import './style.css';
import prototype from './prototype';
import { Images } from './Images';

prototype();

document.addEventListener('DOMContentLoaded', async () => {
	const nodes = document.querySelectorAll('body *');
	const images = new Images();
	await images.load(Array.from(nodes));


	console.log(images.get())
});
