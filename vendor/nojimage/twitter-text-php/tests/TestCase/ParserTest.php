<?php

/**
 * @author    Takashi Nojima
 * @copyright Copyright 2018, Takashi Nojima
 * @license   http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package   Twitter.Text
 */

namespace Twitter\Text\TestCase;

use PHPUnit\Framework\TestCase;
use Twitter\Text\Configuration;
use Twitter\Text\Parser;

/**
 * Twitter Text Parser Unit Tests
 *
 * @author    Takashi Nojima
 * @copyright Copyright 2018, Takashi Nojima
 * @license   http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package   Twitter.Text
 */
class ParserTest extends TestCase
{

    /**
     * @var Parser
     */
    private $parser;

    /**
     * Set up fixtures
     *
     * @return void
     */
    protected function setUp()
    {
        $this->parser = new Parser();
    }

    /**
     * Tears down fixtures
     *
     * @return void
     */
    protected function tearDown()
    {
        unset($this->parser);
    }

    /**
     * test for create
     */
    public function testCreate()
    {
        $this->assertInstanceOf('\Twitter\Text\Parser', Parser::create());
    }

    /**
     * test for parseTweet
     */
    public function testParseTweet()
    {
        // @codingStandardsIgnoreStart
        $text = "We're expanding the character limit! We want it to be easier and faster for everyone to express themselves.\n\nMore characters. More expression. More of what's happening.\nhttps://cards.twitter.com/cards/gsby/4ztbu";
        // @codingStandardsIgnoreEnd
        $result = $this->parser->parseTweet($text);

        $this->assertInstanceOf('\Twitter\Text\ParseResults', $result);
        $this->assertSame(192, $result->weightedLength);
        $this->assertSame(685, $result->permillage);
        $this->assertSame(true, $result->valid);
        $this->assertSame(0, $result->displayRangeStart);
        $this->assertSame(210, $result->displayRangeEnd);
        $this->assertSame(0, $result->validRangeStart);
        $this->assertSame(210, $result->validRangeEnd);
    }

    /**
     * test for parseTweet with v1 configuration
     */
    public function testParseTweetWithV1Configuration()
    {
        // @codingStandardsIgnoreStart
        $text = "We're expanding the character limit! We want it to be easier and faster for everyone to express themselves.\n\nMore characters. More expression. More of what's happening.\nhttps://cards.twitter.com/cards/gsby/4ztbu";
        // @codingStandardsIgnoreEnd

        $result = Parser::create(new Configuration(array(
            'version' => 1,
            'maxWeightedTweetLength' => 140,
            'scale' => 1,
            'defaultWeight' => 1,
            'transformedURLLength' => 23,
            'ranges' => array(),
        )))->parseTweet($text);

        $this->assertInstanceOf('\Twitter\Text\ParseResults', $result);
        $this->assertSame(192, $result->weightedLength);
        $this->assertSame(1371, $result->permillage);
        $this->assertSame(false, $result->valid);
        $this->assertSame(0, $result->displayRangeStart);
        $this->assertSame(210, $result->displayRangeEnd);
        $this->assertSame(0, $result->validRangeStart);
        $this->assertSame(139, $result->validRangeEnd);
    }

    /**
     * test for parseTweet given a empty character
     */
    public function testParseTweetWithEmpty()
    {
        $result = $this->parser->parseTweet('');

        $this->assertSame(0, $result->weightedLength);
        $this->assertSame(0, $result->permillage);
        $this->assertSame(false, $result->valid);
        $this->assertSame(0, $result->displayRangeStart);
        $this->assertSame(0, $result->displayRangeEnd);
        $this->assertSame(0, $result->validRangeStart);
        $this->assertSame(0, $result->validRangeEnd);
    }

    /**
     * test for parseTweet given a null
     */
    public function testParseTweetWithNull()
    {
        $result = $this->parser->parseTweet(null);

        $this->assertSame(0, $result->weightedLength);
        $this->assertSame(0, $result->permillage);
        $this->assertSame(false, $result->valid);
        $this->assertSame(0, $result->displayRangeStart);
        $this->assertSame(0, $result->displayRangeEnd);
        $this->assertSame(0, $result->validRangeStart);
        $this->assertSame(0, $result->validRangeEnd);
    }

    /**
     * test for parseTweet given emoji strings
     */
    public function testParseTweetWithEmoji()
    {
        // @codingStandardsIgnoreStart
        $text = '😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷😷';
        // @codingStandardsIgnoreEnd

        $result = $this->parser->parseTweet($text);

        $this->assertSame(320, $result->weightedLength);
        $this->assertSame(1142, $result->permillage);
        $this->assertSame(false, $result->valid);
        $this->assertSame(0, $result->displayRangeStart);
        $this->assertSame(319, $result->displayRangeEnd);
        $this->assertSame(0, $result->validRangeStart);
        $this->assertSame(279, $result->validRangeEnd);
    }

    /**
     * test for parseTweet Count a mix of single byte single word, and double word unicode characters
     */
    public function testParseTweetWithEmojiAndChars()
    {
        $text = 'H🐱☺👨‍👩‍👧‍👦';

        $result = $this->parser->parseTweet($text);

        $this->assertSame(7, $result->weightedLength);
        $this->assertSame(true, $result->valid);
        $this->assertSame(25, $result->permillage);
        $this->assertSame(0, $result->displayRangeStart);
        $this->assertSame(14, $result->displayRangeEnd);
        $this->assertSame(0, $result->validRangeStart);
        $this->assertSame(14, $result->validRangeEnd);
    }

    /**
     * test for parseTweet Count unicode emoji chars outside the basic multilingual plane with skin tone modifiers
     */
    public function testParseTweetWithEmojiOutsideMultilingualPlanWithSkinTone()
    {
        $text = '🙋🏽👨‍🎤';

        $result = $this->parser->parseTweet($text);

        $this->assertSame(4, $result->weightedLength);
        $this->assertSame(true, $result->valid);
        $this->assertSame(14, $result->permillage);
        $this->assertSame(0, $result->displayRangeStart);
        $this->assertSame(8, $result->displayRangeEnd);
        $this->assertSame(0, $result->validRangeStart);
        $this->assertSame(8, $result->validRangeEnd);
    }

    /**
     * test for parseTweet given CJK strings
     */
    public function testParseTweetWithCJK()
    {
        // @codingStandardsIgnoreStart
        $text = '故人西辞黄鹤楼，烟花三月下扬州。孤帆远影碧空尽，唯见长江天际流。朱雀桥边野草花，乌衣巷口夕阳斜。旧时王谢堂前燕，飞入寻常百姓家。朝辞白帝彩云间，千里江陵一日还。两岸猿声啼不住，轻舟已过万重山。泪湿罗巾梦不成，夜深前殿按歌声。红颜未老恩先断，斜倚薰笼坐到明。独在异乡为异客，每逢佳节倍思亲。遥知兄弟登高处，遍插茱萸少一人。';
        // @codingStandardsIgnoreEnd

        $result = $this->parser->parseTweet($text);

        $this->assertSame(320, $result->weightedLength);
        $this->assertSame(1142, $result->permillage);
        $this->assertSame(false, $result->valid);
        $this->assertSame(0, $result->displayRangeStart);
        $this->assertSame(159, $result->displayRangeEnd);
        $this->assertSame(0, $result->validRangeStart);
        $this->assertSame(139, $result->validRangeEnd);
    }

    /**
     * Handle a 64 character domain without protocol
     */
    public function testParseTweetWith64CharDomainWithoutProtocol()
    {
        $text = 'randomurlrandomurlrandomurlrandomurlrandomurlrandomurlrandomurls.com';
        $result = $this->parser->parseTweet($text);

        $this->assertSame(68, $result->weightedLength);
        $this->assertSame(242, $result->permillage);
        $this->assertSame(true, $result->valid);
        $this->assertSame(0, $result->displayRangeStart);
        $this->assertSame(67, $result->displayRangeEnd);
        $this->assertSame(0, $result->validRangeStart);
        $this->assertSame(67, $result->validRangeEnd);
    }

    /**
     * test for parseTweet Count unicode emoji #, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 + keycap (\x{20e3})
     */
    public function testParseTweetWithEmojiNumberWithKeycapWithoutVariantSelector()
    {
        $text = '1⃣';

        $result = $this->parser->parseTweet($text);

        $this->assertSame(2, $result->weightedLength);
        $this->assertTrue($result->valid);
        $this->assertSame(7, $result->permillage);
        $this->assertSame(0, $result->displayRangeStart);
        $this->assertSame(1, $result->displayRangeEnd);
        $this->assertSame(0, $result->validRangeStart);
        $this->assertSame(1, $result->validRangeEnd);
    }
}
