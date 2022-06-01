<script>
	import { __ } from '@wordpress/i18n';
</script>

<div class="jb-score-context">
	<span class="jb-score-context__info-icon">i</span>
	<div class="jb-score-context__info-container">
		<p>
			{__(
				"Your Overall Score is a summary of your website performance across both mobile and desktop devices. It gives a general idea of your sites' overall performance.",
				'jetpack-boost'
			)}
		</p>
		<table>
			<tr>
				<th>A</th>
				<td>90+</td>
			</tr>
			<tr>
				<th>B</th>
				<td>75 - 90</td>
			</tr>
			<tr>
				<th>C</th>
				<td>50 - 75</td>
			</tr>
		</table>
		<table>
			<tr>
				<th>D</th>
				<td>35 - 50</td>
			</tr>
			<tr>
				<th>E</th>
				<td>25 - 35</td>
			</tr>
			<tr>
				<th>F</th>
				<td>0 - 25</td>
			</tr>
		</table>
		<i />
	</div>
</div>
