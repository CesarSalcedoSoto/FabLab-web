/**
 * Payload CMS Collections
 * 
 * Exporta todas las colecciones disponibles.
 * Importar desde aquí para mantener consistencia.
 * 
 * @example
 * ```typescript
 * import { collections, Users, Posts } from '@/features/cms/infrastructure/payload/collections';
 * ```
 */

// Colecciones de Usuario y Media
export { Users } from './Users';
export { Media } from './Media';

// Blog
export { Posts } from './Posts';
export { Categories } from './Categories';

// Servicios y Equipamiento
export { Services } from './Services';
export { Equipment } from './Equipment';
export { EquipmentRequests } from './EquipmentRequests';
export { EquipmentUsage } from './EquipmentUsage';
export { EquipmentReservations } from './EquipmentReservations';

// Inventario
export { InventoryItems } from './InventoryItems';

// Equipo
export { TeamMembers } from './TeamMembers';

// Proyectos
export { Projects } from './Projects';

// Eventos
export { Events } from './Events';

// Contenido
export { FAQs } from './FAQs';
export { Testimonials } from './Testimonials';

// Contacto
export { ContactMessages } from './ContactMessages';

// Array para usar en payload.config.ts
import { Users } from './Users';
import { Media } from './Media';
import { Posts } from './Posts';
import { Categories } from './Categories';
import { Services } from './Services';
import { Equipment } from './Equipment';
import { EquipmentRequests } from './EquipmentRequests';
import { EquipmentUsage } from './EquipmentUsage';
import { EquipmentReservations } from './EquipmentReservations';
import { InventoryItems } from './InventoryItems';
import { TeamMembers } from './TeamMembers';
import { Projects } from './Projects';
import { Events } from './Events';
import { FAQs } from './FAQs';
import { Testimonials } from './Testimonials';
import { ContactMessages } from './ContactMessages';

export const collections = [
    // Core
    Users,
    Media,
    // Blog
    Posts,
    Categories,
    // Servicios
    Services,
    Equipment,
    EquipmentRequests,
    EquipmentUsage,
    EquipmentReservations,
    // Inventario
    InventoryItems,
    // Equipo
    TeamMembers,
    // Proyectos
    Projects,
    // Eventos
    Events,
    // Contenido
    FAQs,
    Testimonials,
    // Contacto
    ContactMessages,
];
