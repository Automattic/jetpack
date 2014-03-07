<?php

class scss_formatter_wp extends scss_formatter {
	public $indentChar = "\t";
	public $tagSeparator = ",\n";
	public $close = "}\n";

	/**
	 * This function is overridden here until the `$tagSeperator` change merges in upstream.
	 *
	 * @see https://github.com/leafo/scssphp/pull/151
	 */
	protected function block($block) {
		if (empty($block->lines) && empty($block->children)) return;
	
		$inner = $pre = $this->indentStr();
	
		$tagSeparator = $this->tagSeparator;
		if (false !== strpos($tagSeparator, "\n")) {
			$tagSeparator .= $pre;
		}
	
		if (!empty($block->selectors)) {
			echo $pre .
				implode($tagSeparator, $block->selectors) .
				$this->open . $this->break;
			$this->indentLevel++;
			$inner = $this->indentStr();
		}
	
		if (!empty($block->lines)) {
			$glue = $this->break.$inner;
			echo $inner . implode($glue, $block->lines);
			if (!empty($block->children)) {
				echo $this->break;
			}
		}
	
		foreach ($block->children as $child) {
			$this->block($child);
		}
	
		if (!empty($block->selectors)) {
			$this->indentLevel--;
			if (empty($block->children)) echo $this->break;
			echo $pre . $this->close . $this->break;
		}
	}
}