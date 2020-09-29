<?php

/**
 * @author    Takashi Nojima
 * @copyright Copyright 2018, Takashi Nojima
 * @license   http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package   Twitter.Text
 */

namespace Twitter\Text\TestCase;

use PHPUnit\Framework\TestCase;
use Twitter\Text\StringUtils;

class StringUtilsTest extends TestCase
{
    /**
     * Test for strlen with emoji
     */
    public function testStrlenEmoji()
    {
        $this->assertSame(1, StringUtils::strlen('☺'), 'U+263A smiling face is 1 char');
        $this->assertSame(1, StringUtils::strlen('🐱'), 'U+1F431 cat face is 1 char');
        $this->assertSame(7, StringUtils::strlen('👨‍👩‍👧‍👦'), 'U+1F468 U+200D U+1F469 U+200D U+1F467 U+200D U+1F466 family: man, woman, girl, boy
 is 7 char');
        $this->assertSame(2, StringUtils::strlen('🧕🏾'), 'U+1F9D5 U+1F3FE woman with headscarf with medium-dark skin tone is 2 char');
        $this->assertSame(7, StringUtils::strlen('🏴󠁧󠁢󠁥󠁮󠁧󠁿'), 'flag (England) is 7 char');
    }

    /**
     * Test for charCount with emoji
     */
    public function testCharCountEmoji()
    {
        $this->assertSame(1, StringUtils::charCount('☺'), 'U+263A smiling face has 1 code point');
        $this->assertSame(2, StringUtils::charCount('🐱'), 'U+1F431 cat face has 2 code point');
        $this->assertSame(11, StringUtils::charCount('👨‍👩‍👧‍👦'), 'U+1F468 U+200D U+1F469 U+200D U+1F467 U+200D U+1F466 family: man, woman, girl, boy
 has 11 code point');
        $this->assertSame(4, StringUtils::charCount('🧕🏾'), 'U+1F9D5 U+1F3FE woman with headscarf with medium-dark skin tone has 4 code point');
        $this->assertSame(14, StringUtils::charCount('🏴󠁧󠁢󠁥󠁮󠁧󠁿'), 'flag (England) has 14 code point');
    }
}
