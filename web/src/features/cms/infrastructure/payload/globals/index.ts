/**
 * Payload CMS Globals
 * 
 * Exporta todas las configuraciones globales.
 * 
 * @example
 * ```typescript
 * import { globals, SiteSettings, LandingConfig } from '@/features/cms/infrastructure/payload/globals';
 * ```
 */

// Configuración del sitio
export { SiteSettings } from './SiteSettings.ts';
export { LandingConfig } from './LandingConfig.ts';

// Páginas
export { EquipoPage } from './EquipoPage.ts';

// Array para usar en payload.config.ts
import { SiteSettings } from './SiteSettings.ts';
import { LandingConfig } from './LandingConfig.ts';
import { EquipoPage } from './EquipoPage.ts';

export const globals = [
    SiteSettings,
    LandingConfig,
    EquipoPage,
];
