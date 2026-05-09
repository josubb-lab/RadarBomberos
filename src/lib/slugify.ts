export function slugify(text: string, maxLength = 75): string {
  const slug = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

  if (slug.length <= maxLength) return slug

  // Corta en la última frontera de palabra antes del límite
  return slug.slice(0, maxLength).replace(/-[^-]*$/, '')
}

export function hallazgoSlug(titulo: string, id: string): string {
  return slugify(titulo) || id.slice(0, 8)
}
