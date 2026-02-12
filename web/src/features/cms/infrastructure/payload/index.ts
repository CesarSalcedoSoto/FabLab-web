/**
 * Payload CMS Infrastructure
 * 
 * Punto de entrada para toda la configuración de Payload.
 * 
 * @example
 * ```typescript
 * // En payload.config.ts
 * import { collections, globals } from '@/features/cms/infrastructure/payload';
 * 
 * export default buildConfig({
 *     collections,
 *     globals,
 * });
 * ```
 */

// Colecciones
export { collections } from './collections/index.ts';
export { Users, Media, Posts, Categories, TeamMembers, Projects, EquipmentRequests, EquipmentUsage } from './collections/index.ts';

// Globals
export { globals } from './globals/index.ts';
export { EquipoPage } from './globals/index.ts';

// Access helpers
export {
    isAdmin,
    isEditor,
    isAuthenticated,
    publicRead,
    isAdminOrSelf,
    adminFieldAccess,
    editorFieldAccess,
    type UserRole,
    type PayloadUser,
} from './access/index.ts';
