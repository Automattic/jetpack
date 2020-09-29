<?php

/**
 * @author     Nick Pope <nick@nickpope.me.uk>
 * @copyright  Copyright © 2010, Mike Cochrane, Nick Pope
 * @license    http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package    Twitter.Text
 */

namespace Twitter\Text\TestCase;

use PHPUnit\Framework\TestCase;
use Twitter\Text\Extractor;
use Twitter\Text\StringUtils;

/**
 * Twitter Extractor Class Unit Tests
 *
 * @author     Nick Pope <nick@nickpope.me.uk>
 * @copyright  Copyright © 2010, Mike Cochrane, Nick Pope
 * @license    http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package    Twitter.Text
 * @param     Extractor $extractor
 */
class ExtractorTest extends TestCase
{
    /**
     * A Test Subject
     *
     * @var Extractor
     */
    private $extractor;

    protected function setUp()
    {
        parent::setUp();
        $this->extractor = Extractor::create();
    }

    protected function tearDown()
    {
        unset($this->extractor);
        parent::tearDown();
    }

    /**
     * @group Extractor
     */
    public function testExtractURLsWithoutProtocol()
    {
        $extracted = Extractor::create()
            ->extractURLWithoutProtocol(false)
            ->extractURLs('text: example.com http://foobar.example.com');
        $this->assertSame(array('http://foobar.example.com'), $extracted, 'Unextract url without protocol');
    }

    /**
     * @group Extractor
     */
    public function testExtractURLsWithIndicesWithoutProtocol()
    {
        $extracted = Extractor::create()
            ->extractURLWithoutProtocol(false)
            ->extractURLsWithIndices('text: example.com');
        $this->assertSame(array(), $extracted, 'Unextract url without protocol');
    }

    /**
     * @group Extractor
     */
    public function testUrlWithSpecialCCTLDWithoutProtocol()
    {
        $text = 'MLB.tv vine.co';
        $this->assertSame(
            array('MLB.tv', 'vine.co'),
            $this->extractor->extractURLs($text),
            'Extract Some ccTLD(co|tv) URLs without protocol'
        );

        $extracted = $this->extractor->extractURLsWithIndices($text);
        $this->assertSame(array(0, 6), $extracted[0]['indices']);
        $this->assertSame(array(7, 14), $extracted[1]['indices']);

        $extracted = $this->extractor->extractURLWithoutProtocol(false)->extractURLsWithIndices($text);
        $this->assertSame(array(), $extracted, 'Unextract url without protocol');
    }

    /**
     * @group Extractor
     */
    public function testExtractURLsWithEmoji()
    {
        $text = '@ummjackson 🤡 https://i.imgur.com/I32CQ81.jpg';
        $extracted = $this->extractor->extractURLsWithIndices($text);
        $this->assertSame(array(14, 45), $extracted[0]['indices']);
        $this->assertSame(
            'https://i.imgur.com/I32CQ81.jpg',
            StringUtils::substr($text, $extracted[0]['indices'][0], $extracted[0]['indices'][1])
        );
    }

    /**
     * @group Extractor
     */
    public function testExtractURLsPrecededByEllipsis()
    {
        $extracted = $this->extractor->extractURLs('text: ...http://www.example.com');
        $this->assertSame(array('http://www.example.com'), $extracted, 'Unextract url preceded by ellipsis');
    }

    /**
     * @group Extractor
     */
    public function testExtractURLsWith64CharDomainWithoutProtocol()
    {
        $text = 'randomurlrandomurlrandomurlrandomurlrandomurlrandomurlrandomurls.com';
        $extracted = $this->extractor->extractURLsWithIndices($text);

        $this->assertSame(array(), $extracted, 'Handle a 64 character domain without protocol');
    }

    /**
     * @group Extractor
     */
    public function testExtractURLsHandleLongUrlWithInvalidDomainLabelsAndShortUrl()
    {
        // @codingStandardsIgnoreStart
        $text = 'Long url with invalid domain labels and a short url: https://somesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurl.com/foo https://somesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurl.com/foo https://somesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurlsomesuperlongurl.com/foo https://validurl.com';
        // @codingStandardsIgnoreEnd

        $extracted = $this->extractor->extractURLsWithIndices($text);
        $this->assertSame(array(
            array(
                'url' => 'https://validurl.com',
                'indices' => array(12056, 12076),
            ),
        ), $extracted, 'Handle long url with invalid domain labels and short url');
    }

    /**
     * @group Extractor
     */
    public function testExtract()
    {
        // @codingStandardsIgnoreStart
        $text = '@someone Hey check out out @otheruser/list_name-01! This is #hashtag1 http://example.com Example cashtags: $TEST $Stock $symbol via @username';
        // @codingStandardsIgnoreEnd

        $extracted = $this->extractor->extract($text);
        $expects = array(
            'hashtags' => array(
                'hashtag1'
            ),
            'cashtags' => array(
                'TEST',
                'Stock',
                'symbol'
            ),
            'urls' => array(
                'http://example.com'
            ),
            'mentions' => array(
                'someone',
                'otheruser',
                'username'
            ),
            'replyto' => 'someone',
            'hashtags_with_indices' => array(
                array(
                    'hashtag' => 'hashtag1',
                    'indices' => array(60, 69)
                )
            ),
            'urls_with_indices' => array(
                array(
                    'url' => 'http://example.com',
                    'indices' => array(70, 88)
                )
            ),
            'mentions_with_indices' => array(
                array(
                    'screen_name' => 'someone',
                    'indices' => array(0, 8)
                ),
                array(
                    'screen_name' => 'otheruser',
                    'indices' => array(27, 50)
                ),
                array(
                    'screen_name' => 'username',
                    'indices' => array(132, 141)
                )
            )
        );

        $this->assertSame($expects, $extracted);
    }

    /**
     * @group Extractor
     */
    public function testExtractEntitiesWithIndices()
    {
        // @codingStandardsIgnoreStart
        $text = '@someone Hey check out out @otheruser/list_name-01! This is #hashtag1 http://example.com Example cashtags: $TEST $Stock $symbol via @username';
        // @codingStandardsIgnoreEnd

        $extracted = $this->extractor->extractEntitiesWithIndices($text);
        $expects = array(
            array(
                'screen_name' => 'someone',
                'list_slug' => '',
                'indices' => array(0, 8)
            ),
            array(
                'screen_name' => 'otheruser',
                'list_slug' => '/list_name-01',
                'indices' => array(27, 50)
            ),
            array(
                'hashtag' => 'hashtag1',
                'indices' => array(60, 69)
            ),
            array(
                'url' => 'http://example.com',
                'indices' => array(70, 88)
            ),
            array(
                'cashtag' => 'TEST',
                'indices' => array(107, 112)
            ),
            array(
                'cashtag' => 'Stock',
                'indices' => array(113, 119)
            ),
            array(
                'cashtag' => 'symbol',
                'indices' => array(120, 127)
            ),
            array(
                'screen_name' => 'username',
                'list_slug' => '',
                'indices' => array(132, 141)
            )
        );

        $this->assertSame($expects, $extracted);
    }

    /**
     * @group Extractor
     */
    public function testExtractEmojiWithIndices()
    {
        $text = 'Unicode 10.0; grinning face with one large and one small eye: 🤪;'
            . ' woman with headscarf: 🧕;'
            . ' (fitzpatrick) woman with headscarf + medium-dark skin tone: 🧕🏾;'
            . ' flag (England): 🏴󠁧󠁢󠁥󠁮󠁧󠁿';

        $expects = array(
            array(
                'emoji' => '🤪',
                'indices' => array(62, 62),
            ),
            array(
                'emoji' => '🧕',
                'indices' => array(87, 87),
            ),
            array(
                'emoji' => '🧕🏾',
                'indices' => array(150, 151),
            ),
            array(
                'emoji' => '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
                'indices' => array(170, 176),
            ),
        );

        $this->assertSame($expects, $this->extractor->extractEmojiWithIndices($text));
    }

    /**
     * test for extract a mix of single byte single word, and double word unicode characters
     */
    public function testExtractEmojiWithIndicesEmojiAndChars()
    {
        $text = 'H🐱☺👨‍👩‍👧‍👦';

        $expects = array(
            array(
                'emoji' => '🐱',
                'indices' => array(1, 1),
            ),
            array(
                'emoji' => '☺',
                'indices' => array(2, 2),
            ),
            array(
                'emoji' => '👨‍👩‍👧‍👦',
                'indices' => array(3, 9),
            ),
        );

        $this->assertSame($expects, $this->extractor->extractEmojiWithIndices($text));
    }

    /**
     * test for extract unicode emoji chars outside the basic multilingual plane with skin tone modifiers
     */
    public function testParseTweetWithEmojiOutsideMultilingualPlanWithSkinTone()
    {
        $text = '🙋🏽👨‍🎤';

        $expects = array(
            array(
                'emoji' => '🙋🏽',
                'indices' => array(0, 1),
            ),
            array(
                'emoji' => '👨‍🎤',
                'indices' => array(2, 4),
            ),
        );

        $this->assertSame($expects, $this->extractor->extractEmojiWithIndices($text));
    }
}
