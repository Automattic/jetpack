<p>
	<strong>
		<?php echo _x( 'Hide the banner', 'action', 'jetpack' ); ?>
	</strong>
	<ul>
		<li>
			<label>
				<input
					<?php checked( $instance['hide'], 'button' ); ?>
					name="<?php echo $this->get_field_name( 'hide' ); ?>"
					type="radio"
					value="button"
				/>
				<?php _e( 'after the user clicks the dismiss button', 'jetpack' ); ?>
			</label>
		</li>
		<li>
			<label>
				<input
					<?php checked( $instance['hide'], 'scroll' ); ?>
					name="<?php echo $this->get_field_name( 'hide' ); ?>"
					type="radio"
					value="scroll"
				/>
				<?php _e( 'after the user scrolls the page', 'jetpack' ); ?>
			</label>
		</li>
		<li>
			<label>
				<input
					<?php checked( $instance['hide'], 'time' ); ?>
					name="<?php echo $this->get_field_name( 'hide' ); ?>"
					type="radio"
					value="time"
				/>
				<?php _e( 'after this amount of time', 'jetpack' ); ?>
			</label>
			<input
				max="1000"
				min="3"
				name="<?php echo $this->get_field_name( 'hide-timeout' ); ?>"
				style="padding: 3px 5px; width: 3em;"
				type="number"
				value="<?php echo esc_attr( $instance['hide-timeout'] ); ?>"
			/>
			<?php _e( 'seconds', 'jetpack' ); ?>
		</li>
	</ul>
</p>

<hr />

<p>
	<strong>
		<?php _e( 'Banner text', 'jetpack' ); ?>
	</strong>
	<ul>
		<li>
			<label>
				<input
					<?php checked( $instance['text'], 'default' ); ?>
					name="<?php echo $this->get_field_name( 'text' ); ?>"
					type="radio"
					value="default"
				/>
				<?php _e( 'Default', 'jetpack' ); ?>
			</label>
		</li>
		<li>
			<label>
				<input
					<?php checked( $instance['text'], 'custom' ); ?>
					name="<?php echo $this->get_field_name( 'text' ); ?>"
					type="radio"
					value="custom"
				/>
				<?php _e( 'Custom:', 'jetpack' ); ?>
			</label>
		</li>
	</ul>
	<textarea
		class="widefat"
		name="<?php echo $this->get_field_name( 'text' ); ?>"
		placeholder="<?php echo esc_attr( $instance['default-text'] ); ?>"
	><?php echo esc_html( $instance['customtext'] ); ?></textarea>
</p>

<hr />

<p>
	<strong>
		<?php _e( 'Color scheme', 'jetpack' ); ?>
	</strong>
	<ul>
		<li>
			<label>
				<input
					<?php checked( $instance['color-scheme'], 'default' ); ?>
					name="<?php echo $this->get_field_name( 'color-scheme' ); ?>"
					type="radio"
					value="default"
				/>
				<?php _e( 'Light', 'jetpack' ); ?>
			</label>
		</li>
		<li>
			<label>
				<input
					<?php checked( $instance['color-scheme'], 'negative' ); ?>
					name="<?php echo $this->get_field_name( 'color-scheme' ); ?>"
					type="radio"
					value="negative"
				/>
				<?php _e( 'Dark', 'jetpack' ); ?>
			</label>
		</li>
	</ul>
</p>

<hr />

<p>
	<strong>
		<?php _e( 'Policy URL', 'jetpack' ); ?>
	</strong>
	<ul>
		<li>
			<label>
				<input
					<?php checked( $instance['policy-url'], 'default' ); ?>
					name="<?php echo $this->get_field_name( 'policy-url' ); ?>"
					type="radio"
					value="default"
				/>
				<?php _e( 'Default', 'jetpack' ); ?>
			</label>
		</li>
		<li>
			<label>
				<input
					<?php checked( $instance['policy-url'], 'custom' ); ?>
					name="<?php echo $this->get_field_name( 'policy-url' ); ?>"
					type="radio"
					value="custom"
				/>
				<?php _e( 'Custom:', 'jetpack' ); ?>
			</label>
			<input
				class="widefat"
				name="<?php echo $this->get_field_name( 'custom-policy-url' ); ?>"
				placeholder="<?php echo esc_attr( $instance['default-policy-url'] ); ?>"
				style="margin-top: .5em;"
				type="text"
				value="<?php echo esc_attr( $instance['custom-policy-url'] ); ?>"
			/>
		</li>
	</ul>
</p>

<p>
	<strong>
		<?php _e( 'Policy link text', 'jetpack' ); ?>
	</strong>
	<label>
		<input
			class="widefat"
			name="<?php echo $this->get_field_name( 'policy-link-text' ); ?>"
			type="text"
			value="<?php echo esc_attr( $instance['policy-link-text'] ); ?>"
		/>
	</label>
</p>

<hr />

<p>
	<strong>
		<?php _e( 'Button text', 'jetpack' ); ?>
	</strong>
	<label>
		<input
			class="widefat"
			name="<?php echo $this->get_field_name( 'button' ); ?>"
			type="text"
			value="<?php echo esc_attr( $instance['button'] ); ?>"
		/>
	</label>
</p>

<p class="small">
	<?php _e( 'It is your own responsibility to ensure that your site complies with the relevant laws.', 'jetpack' ); ?>
	<a href="">
		<?php _e( 'Click here for more information', 'jetpack' ); ?>
	</a>
</p>
