# SMS Best Practices FAQ

## SMS Best Practices and Limitations

### Overview

While the Linq API supports sending messages via iMessage, RCS, and SMS, the SMS channel has unique carrier-level limitations and filtering mechanisms that require special consideration. This guide outlines best practices for SMS messaging to ensure optimal delivery rates.

### Important: SMS vs. iMessage/RCS

**SMS is fundamentally different from iMessage and RCS.** While iMessage and RCS support rich media, long messages, and high-volume sending, SMS is subject to strict carrier-level filtering and throttling. For best results:

* **Use iMessage or RCS for**: Long-form content, media-rich messages, high-volume sending, digest/newsletter formats
* **Use SMS for**: Short, simple, human-like messages that mimic natural conversation patterns

### Carrier-Level Filtering

SMS messages pass through wireless carrier networks that employ sophisticated anti-spam systems. These systems:

* Work on **pattern recognition and risk scoring**
* Cause **silent failures** (messages appear sent but never deliver)
* Are **invisible to both Linq and your systems** (no error reporting)
* Use **progressive throttling** (once flagged, issues compound over time)

### Volume Limitations

#### Message Volume Thresholds

Carrier filtering is triggered by high-volume sending patterns:

* **10,000-16,000 messages within 5 days** has been observed to trigger carrier throttling
* Once throttling begins, delivery rates decline progressively
* Recovery requires reducing volume and changing sending patterns

#### Message Segmentation

SMS messages are limited to 160 characters per segment. Longer messages are automatically split:

* **160 characters or less**: 1 segment (optimal)
* **161-320 characters**: 2 segments
* **321-480 characters**: 3 segments
* And so on...

**Impact of long messages:**

* Each segment counts toward your send rate
* A 960-character message = 6 segments = 6x the throttling risk
* Messages over **6-10 segments (\~1,600 characters)** have extremely high failure rates

**Special character encoding:**

* Emoji and special characters force UCS-2 encoding
* UCS-2 encoding reduces segment size to **70 characters** per segment
* This effectively doubles your segment count for messages with special characters

#### Recommendation

**Keep SMS messages under 160 characters** whenever possible. For longer content, use iMessage or RCS instead.

### Content Best Practices

#### URLs and Links

Carriers actively filter messages containing certain link patterns:

1. **Multiple URLs in a single message**
   * Frequently silently blocked by carriers
   * **Solution**: Limit to one URL per message, or use iMessage/RCS
2. **Link shorteners and tracking URLs**
   * Carriers flag URL shorteners (bit.ly, tinyurl, etc.) as potential threats
   * Tracking parameters can trigger spam filters
   * **Solution**: Use direct, untracked URLs, or use iMessage/RCS for tracked links
3. **Suspicious domains**
   * New or unestablished domains may be flagged
   * **Solution**: Use established, recognizable domain names

#### Message Formatting

Carriers interpret certain formatting patterns as automated/bulk messaging:

**Avoid in SMS:**

* Bullet points and numbered lists
* Multiple paragraphs
* Digest or newsletter structures
* Highly formatted content
* Excessive punctuation or ALL CAPS

**Prefer in SMS:**

* Single paragraph, conversational text
* Natural sentence structure
* Human-like tone and pacing
* Simple, plain-text formatting

**For formatted content:** Use iMessage or RCS instead.

#### Special Characters and Emoji

* Emoji and special characters force UCS-2 encoding
* UCS-2 reduces message capacity from 160 to 70 characters per segment
* This doubles your segment count and accelerates throttling
* **Recommendation**: Avoid emoji in high-volume SMS. Use iMessage/RCS for emoji-rich messages.

### Media and Attachments

#### MMS (Multimedia Messaging)

Sending images and media via SMS/MMS has additional limitations:

1. **Faster throttling**
   * MMS triggers carrier limits faster than plain SMS
   * Multiple images accelerate rate limiting
2. **Delivery latency**
   * MMS messages deliver more slowly than SMS
   * Bandwidth constraints on carrier networks
3. **Out-of-order delivery**
   * MMS messages may arrive out of sequence
   * Especially problematic when mixing SMS and MMS in the same conversation

#### Recommendation

**For image and media sending, strongly prefer iMessage or RCS.** Only use MMS for occasional, low-frequency media sharing.

### Send Pacing

#### Human-Like Patterns

Carriers detect and filter automated sending patterns. To maintain deliverability:

1. **Implement send throttling**
   * Space out messages to mimic human conversation patterns
   * Avoid burst sending (many messages at once)
   * Consider implementing a queue system
2. **Vary send timing**
   * Don't send messages at perfectly regular intervals
   * Avoid sending large batches at the same time of day
3. **Monitor volume**
   * Track your daily and weekly SMS volume
   * If approaching 10,000+ messages in a 5-day period, consider switching to iMessage/RCS for some recipients

### Recovery from Throttling

If a phone number becomes flagged by carrier filtering:

1. **Reduce volume immediately** - Stop or significantly reduce SMS sending from that number
2. **Change content patterns** - Avoid the content types that triggered filtering
3. **Allow recovery time** - Carrier filters may take time to reset
4. **Contact Linq support** - We can work with carriers to investigate, but recovery is not guaranteed

**Prevention is critical** - Once flagged, a number may remain throttled even after reducing volume.

### Best Practices Summary

#### Do's ✓

* Keep messages under 160 characters
* Use single, direct URLs (no shorteners)
* Write in a natural, conversational tone
* Implement send pacing/throttling
* Monitor your sending volume
* Use iMessage/RCS for rich content, media, and high-volume sending

#### Don'ts ✗

* Don't send high-volume SMS (prefer iMessage/RCS for scale)
* Don't use multiple URLs in one message
* Don't use URL shorteners or tracking links
* Don't use bullet points, lists, or newsletter formatting
* Don't send long messages (over 160 characters)
* Don't send frequent MMS/images via SMS
* Don't use emoji or special characters in high-volume SMS
* Don't send in burst patterns

### When in Doubt

**Default to iMessage or RCS** for any messaging that involves:

* High volume (hundreds to thousands of messages)
* Long messages or rich formatting
* Multiple links or media attachments
* Marketing or newsletter content
* Time-sensitive delivery requirements

SMS should be reserved for **short, simple, conversational messages sent at human-like volumes and pacing.**

### Support

If you're experiencing SMS delivery issues or have questions about your specific use case, contact Linq support at <support@linqapp.com>.
