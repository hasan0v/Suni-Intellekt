/**
 * Parse text content and return array of text and link elements
 * Detects URLs starting with http://, https://, www., etc.
 */
import React from 'react'

export function parseContentWithLinks(text: string): (string | { type: 'link'; url: string; text: string })[] {
  if (!text) return []

  // Regex to match URLs
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\/[^\s]*)/g
  
  const result: (string | { type: 'link'; url: string; text: string })[] = []
  let lastIndex = 0
  let match

  const regex = new RegExp(urlRegex)
  while ((match = regex.exec(text)) !== null) {
    // Add text before URL
    if (match.index > lastIndex) {
      result.push(text.substring(lastIndex, match.index))
    }

    let url = match[0]
    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.startsWith('www.')) {
        url = 'https://' + url
      } else {
        url = 'https://' + url
      }
    }

    result.push({
      type: 'link',
      url,
      text: match[0]
    })

    lastIndex = regex.lastIndex
  }

  // Add remaining text
  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex))
  }

  return result.length > 0 ? result : [text]
}

/**
 * React component to render parsed content with clickable links
 */
interface RenderContentWithLinksProps {
  content: string
}

export function RenderContentWithLinks({ content }: RenderContentWithLinksProps) {
  const parsed = parseContentWithLinks(content)

  return (
    <>
      {parsed.map((item, idx) => {
        if (typeof item === 'string') {
          return <React.Fragment key={idx}>{item}</React.Fragment>
        }
        return (
          <a
            key={idx}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-samsung-blue hover:text-samsung-blue/80 font-semibold underline hover:no-underline transition-colors"
            title={item.url}
          >
            {item.text}
          </a>
        )
      })}
    </>
  )
}
