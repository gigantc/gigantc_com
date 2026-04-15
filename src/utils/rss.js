import axios from 'axios';
import { getProxyUrl } from '@/config';

const EMPTY_LINK = '#';

const decodeHtmlEntities = (text = '') => {
  const parser = new DOMParser();
  return parser.parseFromString(`<!doctype html><body>${text}`, 'text/html').body.textContent || '';
};

const stripHtml = (text = '') => {
  const parser = new DOMParser();
  return parser.parseFromString(text, 'text/html').body.textContent || '';
};

const normalizeWhitespace = (text = '') => {
  return text.replace(/\s+/g, ' ').trim();
};

const truncateText = (text, maxLength = 300) => {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trimEnd()}...`;
};

const getEntryLink = (entry) => {
  const links = entry.getElementsByTagName('link');

  for (let i = 0; i < links.length; i += 1) {
    const rel = links[i].getAttribute('rel');
    if (!rel || rel === 'alternate') {
      return links[i].getAttribute('href') || EMPTY_LINK;
    }
  }

  return EMPTY_LINK;
};

const getItemLink = (item) => {
  const links = item.getElementsByTagName('link');

  for (let i = 0; i < links.length; i += 1) {
    if (links[i].namespaceURI === null || links[i].namespaceURI === '') {
      return links[i].textContent || EMPTY_LINK;
    }
  }

  return EMPTY_LINK;
};

const getFirstTagText = (node, tagNames) => {
  for (const tagName of tagNames) {
    const match = node.getElementsByTagName(tagName)[0];
    if (match?.textContent) {
      return match.textContent;
    }

    const fallbackMatch = Array.from(node.getElementsByTagName('*')).find(
      (element) => element.tagName?.toLowerCase() === tagName.toLowerCase()
    );
    if (fallbackMatch?.textContent) {
      return fallbackMatch.textContent;
    }
  }

  return '';
};

const getElementsByTagNames = (node, tagNames) => {
  for (const tagName of tagNames) {
    const matches = Array.from(node.getElementsByTagName(tagName));
    if (matches.length > 0) {
      return matches;
    }

    const fallbackMatches = Array.from(node.getElementsByTagName('*')).filter(
      (element) => element.tagName?.toLowerCase() === tagName.toLowerCase()
    );
    if (fallbackMatches.length > 0) {
      return fallbackMatches;
    }
  }

  return [];
};

const getImageCandidatesFromElements = (elements, attributeNames) => {
  for (const element of elements) {
    for (const attributeName of attributeNames) {
      const value = element.getAttribute(attributeName);
      if (value) {
        return value;
      }
    }
  }

  return '';
};

const getAttributeFromElements = (node, tagNames, attributeNames) => {
  const matches = getElementsByTagNames(node, tagNames);
  return getImageCandidatesFromElements(matches, attributeNames);
};

const getLinkEnclosure = (node) => {
  const links = Array.from(node.getElementsByTagName('link'));
  const enclosureLink = links.find((link) => link.getAttribute('rel') === 'enclosure');
  if (!enclosureLink) {
    return '';
  }

  return enclosureLink.getAttribute('href') || enclosureLink.getAttribute('url') || '';
};

const getImageFromDescription = (node, isAtom) => {
  const htmlSource = isAtom
    ? getFirstTagText(node, ['content', 'summary'])
    : getFirstTagText(node, ['content:encoded', 'description', 'encoded']);

  return getImageFromHtml(htmlSource);
};

const isLikelyImageUrl = (value = '') => {
  return /\.(avif|gif|jpe?g|png|webp)(\?|$)/i.test(value) || /image/i.test(value);
};

const pickImageUrl = (candidates) => {
  return candidates.find((candidate) => candidate && isLikelyImageUrl(candidate)) || candidates.find(Boolean) || '';
};

const getImageUrl = (node, isAtom) => {
  const candidates = [
    getAttributeFromElements(node, ['media:content', 'media:thumbnail', 'thumbnail'], ['url', 'href']),
    getAttributeFromElements(node, ['enclosure'], ['url', 'href', 'src', 'type']),
    getLinkEnclosure(node),
    getImageFromDescription(node, isAtom),
  ];

  return pickImageUrl(candidates);
};

const getImageFromHtml = (html = '') => {
  if (!html) {
    return '';
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.querySelector('img')?.getAttribute('src') || '';
};

const getExcerpt = (node, isAtom) => {
  const rawExcerpt = isAtom
    ? getFirstTagText(node, ['summary', 'content'])
    : getFirstTagText(node, ['description', 'content:encoded', 'encoded']);

  const cleanedExcerpt = normalizeWhitespace(stripHtml(decodeHtmlEntities(rawExcerpt)));
  return cleanedExcerpt ? truncateText(cleanedExcerpt, 300) : '';
};


const parseTimestamp = (value) => {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
};

export const fetchParsedFeed = async (feedUrl) => {
  const proxyUrl = getProxyUrl(feedUrl);
  const response = await axios.get(proxyUrl);
  const parser = new DOMParser();
  const xml = parser.parseFromString(response.data, 'text/xml');

  const parseError = xml.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML structure.');
  }

  const isAtom = xml.documentElement.nodeName === 'feed';
  const channel = xml.querySelector('channel');
  const channelLink = isAtom
    ? xml.querySelector('link')?.getAttribute('href') || null
    : channel?.getElementsByTagName('link')[0]?.textContent || null;

  const items = isAtom
    ? Array.from(xml.querySelectorAll('entry')).map((entry, index) => {
        const pubDate = getFirstTagText(entry, ['updated', 'published']);
        return {
          id: `${feedUrl}-${index}-${getEntryLink(entry)}`,
          title: decodeHtmlEntities(entry.querySelector('title')?.textContent || 'No Title'),
          link: getEntryLink(entry),
          pubDate,
          pubTimestamp: parseTimestamp(pubDate),
          excerpt: getExcerpt(entry, true),
          imageUrl: getImageUrl(entry, true),
        };
      })
    : Array.from(xml.querySelectorAll('item')).map((item, index) => {
        const pubDate = getFirstTagText(item, ['pubDate', 'dc:date']);
        return {
          id: `${feedUrl}-${index}-${getItemLink(item)}`,
          title: decodeHtmlEntities(item.querySelector('title')?.textContent || 'No Title'),
          link: getItemLink(item),
          pubDate,
          pubTimestamp: parseTimestamp(pubDate),
          excerpt: getExcerpt(item, false),
          imageUrl: getImageUrl(item, false),
        };
      });

  return { channelLink, items };
};

export const formatStoryTimestamp = (timestamp) => {
  if (!timestamp) {
    return '';
  }

  const date = new Date(timestamp);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return `${month}/${day} at ${time}`;
};
