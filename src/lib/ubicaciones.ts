export const COMUNIDADES = [
  'Andalucía', 'Aragón', 'Asturias', 'Baleares', 'Canarias', 'Cantabria',
  'Castilla-La Mancha', 'Castilla y León', 'Cataluña', 'Comunidad Valenciana',
  'Extremadura', 'Galicia', 'La Rioja', 'Madrid', 'Murcia', 'Navarra', 'País Vasco',
]

export const CIUDADES = [
  'Sevilla', 'Málaga', 'Granada', 'Córdoba', 'Almería', 'Cádiz', 'Huelva', 'Jaén',
  'Zaragoza', 'Oviedo', 'Gijón', 'Palma', 'Las Palmas', 'Tenerife', 'Santander',
  'Toledo', 'Albacete', 'Ciudad Real', 'Cuenca', 'Guadalajara',
  'Burgos', 'León', 'Salamanca', 'Valladolid', 'Zamora', 'Segovia', 'Soria', 'Ávila',
  'Barcelona', 'Tarragona', 'Lleida', 'Girona',
  'Valencia', 'Alicante', 'Castellón',
  'Badajoz', 'Cáceres',
  'A Coruña', 'Vigo', 'Pontevedra', 'Lugo', 'Ourense',
  'Logroño', 'Murcia', 'Pamplona', 'Bilbao', 'Vitoria', 'San Sebastián',
  'Ceuta', 'Melilla',
  'Alcalá de Henares', 'Móstoles', 'Getafe', 'Alcorcón', 'Leganés',
  'Badalona', 'Sabadell', 'Terrassa', 'Hospitalet',
  'Elche', 'Torrevieja', 'Benidorm',
]

export const TODAS_UBICACIONES = [...COMUNIDADES, ...CIUDADES]

export function slugUbicacion(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function nombreDesdeSlug(slug: string): string {
  return TODAS_UBICACIONES.find(u => slugUbicacion(u) === slug) ?? slug
}
