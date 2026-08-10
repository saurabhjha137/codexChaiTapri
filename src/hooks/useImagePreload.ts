import { useEffect } from 'react'

/**
 * Warms the browser's image cache for a set of URLs on mount, so switching
 * scenes (e.g. rain / tapri backgrounds) doesn't cause a visible flash.
 */
export function useImagePreload(urls: readonly string[]): void {
  useEffect(() => {
    const images = urls.map((src) => {
      const image = new Image()
      image.src = src
      return image
    })
    return () => {
      images.forEach((image) => {
        image.src = ''
      })
    }
  }, [urls])
}
