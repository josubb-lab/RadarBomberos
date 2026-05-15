-- migrate-001-procesos.sql
-- Ejecutar en Supabase SQL Editor

-- ── Tabla principal: procesos selectivos ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS procesos_selectivos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  organismo       text NOT NULL,
  comunidad       text,
  provincia       text,
  municipio       text,
  cuerpo          text,
  plazas          int,
  estado          text NOT NULL DEFAULT 'activo',
    -- abierto | activo | impugnado | suspendido | cerrado | anulado
  fecha_pub       date,
  fecha_fin_inst  date,
  url_oficial     text,
  descripcion     text,
  nicho           text NOT NULL DEFAULT 'bomberos',
  curado          boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Tabla de señales vinculadas a proceso ────────────────────────────────────

CREATE TABLE IF NOT EXISTS senales_proceso (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proceso_id  uuid NOT NULL REFERENCES procesos_selectivos(id) ON DELETE CASCADE,
  tipo        text NOT NULL,
    -- convocatoria | correccion | impugnacion | sentencia | anulacion | recurso | suspension
  titulo      text NOT NULL,
  fecha       date,
  url         text,
  fuente      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Índices ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_procesos_nicho_estado
  ON procesos_selectivos(nicho, estado);

CREATE INDEX IF NOT EXISTS idx_procesos_updated
  ON procesos_selectivos(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_senales_proceso_id
  ON senales_proceso(proceso_id);

-- ── Trigger: updated_at automático ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_procesos_updated_at ON procesos_selectivos;
CREATE TRIGGER trg_procesos_updated_at
  BEFORE UPDATE ON procesos_selectivos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RLS: lectura pública, escritura solo autenticada ────────────────────────

ALTER TABLE procesos_selectivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE senales_proceso     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lectura_publica_procesos"
  ON procesos_selectivos FOR SELECT USING (true);

CREATE POLICY "lectura_publica_senales"
  ON senales_proceso FOR SELECT USING (true);
