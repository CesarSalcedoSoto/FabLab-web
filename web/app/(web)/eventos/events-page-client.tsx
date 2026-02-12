"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Users, ExternalLink, Tag, Search, Video, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface EventItem {
  id: string;
  title: string;
  slug: string;
  type: string;
  description: string;
  featuredImage?: { url?: string; alt?: string } | null;
  startDate: string;
  endDate?: string;
  location?: string;
  isOnline?: boolean;
  capacity?: number;
  registrationUrl?: string;
  price?: string;
  status: string;
  featured?: boolean;
  tags?: { tag: string }[];
}

const typeLabels: Record<string, string> = {
  workshop: "Taller",
  course: "Curso",
  talk: "Charla",
  hackathon: "Hackathon",
  "open-day": "Open Day",
  meetup: "Meetup",
};

const typeColors: Record<string, string> = {
  workshop: "bg-blue-100 text-blue-800",
  course: "bg-purple-100 text-purple-800",
  talk: "bg-green-100 text-green-800",
  hackathon: "bg-orange-100 text-orange-800",
  "open-day": "bg-pink-100 text-pink-800",
  meetup: "bg-teal-100 text-teal-800",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

function isUpcoming(d: string) {
  return new Date(d) >= new Date();
}

export function EventsPageClient() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/payload/events?where[status][equals]=published&sort=-startDate&limit=100&depth=1");
        const data = await res.json();
        setEvents((data.docs || []).map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          slug: doc.slug,
          type: doc.type,
          description: doc.description,
          featuredImage: doc.featuredImage ? { url: doc.featuredImage.url, alt: doc.featuredImage.alt } : null,
          startDate: doc.startDate,
          endDate: doc.endDate,
          location: doc.location,
          isOnline: doc.isOnline,
          capacity: doc.capacity,
          registrationUrl: doc.registrationUrl,
          price: doc.price,
          status: doc.status,
          featured: doc.featured,
          tags: doc.tags,
        })));
      } catch (err) {
        console.error("Error cargando eventos:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || e.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const upcomingEvents = filteredEvents.filter(e => isUpcoming(e.startDate));
  const pastEvents = filteredEvents.filter(e => !isUpcoming(e.startDate));

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-600 to-purple-700 text-white py-20 lg:py-28">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Eventos y Talleres
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto"
          >
            Descubre talleres, cursos y actividades para aprender fabricación digital
          </motion.p>
        </div>
      </section>

      {/* Filters */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Buscar eventos..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setTypeFilter(null)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!typeFilter ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              Todos
            </button>
            {Object.entries(typeLabels).map(([key, label]) => (
              <button key={key} onClick={() => setTypeFilter(key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${typeFilter === key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-blue-600" /> Próximos Eventos
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingEvents.map((event, i) => (
                    <EventCard key={event.id} event={event} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-600">Eventos Pasados</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {pastEvents.map((event, i) => (
                    <EventCard key={event.id} event={event} index={i} past />
                  ))}
                </div>
              </div>
            )}

            {filteredEvents.length === 0 && (
              <div className="text-center py-20">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No se encontraron eventos</p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function EventCard({ event, index, past }: { event: EventItem; index: number; past?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${past ? "opacity-75" : ""}`}
    >
      {event.featuredImage?.url && (
        <div className="relative h-48">
          <Image src={event.featuredImage.url} alt={event.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
          <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${typeColors[event.type] || "bg-gray-100 text-gray-800"}`}>
            {typeLabels[event.type] || event.type}
          </span>
        </div>
      )}
      <div className="p-5">
        {!event.featuredImage?.url && (
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${typeColors[event.type] || "bg-gray-100 text-gray-800"}`}>
            {typeLabels[event.type] || event.type}
          </span>
        )}
        <h3 className="text-lg font-bold mb-2 line-clamp-2">{event.title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>

        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(event.startDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{formatTime(event.startDate)}{event.endDate ? ` - ${formatTime(event.endDate)}` : ""}</span>
          </div>
          {(event.location || event.isOnline) && (
            <div className="flex items-center gap-2">
              {event.isOnline ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
              <span>{event.isOnline ? "Online" : event.location}</span>
            </div>
          )}
          {event.price && (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span>{event.price}</span>
            </div>
          )}
        </div>

        {event.registrationUrl && !past && (
          <a
            href={event.registrationUrl} target="_blank" rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors w-full justify-center"
          >
            Inscribirse <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </motion.div>
  );
}
