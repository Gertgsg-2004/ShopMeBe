import { useEffect } from 'react'

const SITE_NAME = 'Shop Mẹ & Bé Ánh Tuyết'

/** Sets document.title and the meta description for the current page. */
export function usePageTitle(title?: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME
    if (description) {
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = 'description'
        document.head.appendChild(meta)
      }
      meta.content = description
    }
    return () => { document.title = SITE_NAME }
  }, [title, description])
}
