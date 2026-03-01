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
export { Users } from './Users.ts';
export { Media } from './Media.ts';

// Blog
export { Posts } from './Posts.ts';
export { Categories } from './Categories.ts';
export { BlogSubscribers } from './BlogSubscribers.ts';

// Servicios y Equipamiento
export { Services } from './Services.ts';
export { Equipment } from './Equipment.ts';
export { EquipmentRequests } from './EquipmentRequests.ts';
export { EquipmentUsage } from './EquipmentUsage.ts';

// Inventario
export { InventoryItems } from './InventoryItems.ts';

// Equipo
export { TeamMembers } from './TeamMembers.ts';

// Proyectos
export { Projects } from './Projects.ts';

// Eventos
export { Events } from './Events.ts';
export { EventRegistrations } from './EventRegistrations.ts';
export { EventAttendance } from './EventAttendance.ts';

// Recursos y Galería
export { Resources } from './Resources.ts';
export { Gallery } from './Gallery.ts';

// Contenido
export { FAQs } from './FAQs.ts';
export { Testimonials } from './Testimonials.ts';

// Contacto
export { ContactMessages } from './ContactMessages.ts';

// Array para usar en payload.config.ts
import { Users } from './Users.ts';
import { Media } from './Media.ts';
import { Posts } from './Posts.ts';
import { Categories } from './Categories.ts';
import { BlogSubscribers } from './BlogSubscribers.ts';
import { Services } from './Services.ts';
import { Equipment } from './Equipment.ts';
import { EquipmentRequests } from './EquipmentRequests.ts';
import { EquipmentUsage } from './EquipmentUsage.ts';
import { InventoryItems } from './InventoryItems.ts';
import { TeamMembers } from './TeamMembers.ts';
import { Projects } from './Projects.ts';
import { Events } from './Events.ts';
import { EventRegistrations } from './EventRegistrations.ts';
import { EventAttendance } from './EventAttendance.ts';
import { Resources } from './Resources.ts';
import { Gallery } from './Gallery.ts';
import { FAQs } from './FAQs.ts';
import { Testimonials } from './Testimonials.ts';
import { ContactMessages } from './ContactMessages.ts';

export const collections = [
    // Core
    Users,
    Media,
    // Blog
    Posts,
    Categories,
    BlogSubscribers,
    // Servicios
    Services,
    Equipment,
    EquipmentRequests,
    EquipmentUsage,
    // Inventario
    InventoryItems,
    // Equipo
    TeamMembers,
    // Proyectos
    Projects,
    // Eventos
    Events,
    EventRegistrations,
    EventAttendance,
    // Recursos y Galería
    Resources,
    Gallery,
    // Contenido
    FAQs,
    Testimonials,
    // Contacto
    ContactMessages,
];
