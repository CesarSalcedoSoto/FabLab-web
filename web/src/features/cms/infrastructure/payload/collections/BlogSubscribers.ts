/**
 * BlogSubscribers Collection - Payload CMS
 *
 * Almacena emails de suscriptores del blog.
 * Cuando se publica un post, se envía email a todos los suscriptores activos.
 *
 * @access
 * - create: Público (formulario de suscripción)
 * - read/update/delete: Admin/Editor
 */

import type { CollectionConfig } from 'payload';
import { isEditor } from '../access/index.ts';

export const BlogSubscribers: CollectionConfig = {
  slug: 'blog-subscribers',
  labels: {
    singular: 'Suscriptor Blog',
    plural: 'Suscriptores Blog',
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'active', 'createdAt'],
    group: 'Blog',
  },
  access: {
    // Cualquiera puede suscribirse
    create: () => true,
    // Solo admin/editor puede ver, editar o eliminar
    read: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      label: 'Correo Electrónico',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Activo',
      defaultValue: true,
      admin: {
        description: 'Desmarcar para dejar de enviar correos a este suscriptor',
      },
    },
    {
      name: 'unsubscribeToken',
      type: 'text',
      label: 'Token de Desuscripción',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
};
