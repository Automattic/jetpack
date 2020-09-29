<?php

/**
 * Created by PhpStorm.
 * User: nojima
 * Date: 2018/10/18
 * Time: 17:16
 */

namespace Twitter\Text\TestCase;

use PHPUnit\Framework\TestCase;
use Twitter\Text\EmojiRegex;

class EmojiRegexTest extends TestCase
{
    public function testEmojiUnicode10()
    {
        $text = 'Unicode 10.0; grinning face with one large and one small eye: 🤪;'
            . ' woman with headscarf: 🧕;'
            . ' (fitzpatrick) woman with headscarf + medium-dark skin tone: 🧕🏾;'
            . ' flag (England): 🏴󠁧󠁢󠁥󠁮󠁧󠁿';

        $expected = array('🤪', '🧕', '🧕🏾', '🏴󠁧󠁢󠁥󠁮󠁧󠁿');

        $result = preg_match_all(EmojiRegex::VALID_EMOJI_PATTERN, $text, $matches);

        $this->assertSame($expected, $matches[0]);
    }

    public function testEmojiUnicode9()
    {
        $text = 'Unicode 9.0; face with cowboy hat: 🤠;'
            . 'woman dancing: 💃, woman dancing + medium-dark skin tone: 💃🏾';
        $expected = array('🤠', '💃', '💃🏾');

        $result = preg_match_all(EmojiRegex::VALID_EMOJI_PATTERN, $text, $matches);

        $this->assertSame($expected, $matches[0]);
    }
}
