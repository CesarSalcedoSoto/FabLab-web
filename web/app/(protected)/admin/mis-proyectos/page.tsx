"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/cards/card";
import { Badge } from "@/shared/ui/misc/badge";
import { Button } from "@/shared/ui/buttons/button";
import { Input } from "@/shared/ui/inputs/input";
import { Label } from "@/shared/ui/labels/label";
import { Textarea } from "@/shared/ui/inputs/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/inputs/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shared/ui/misc/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/tables/table";
import {
    FolderTree,
    Search,
    Loader2,
    CalendarDays,
    Users,
    FileText,
    Upload,
    Download,
    Trash2,
    Eye,
    ChevronDown,
    ChevronUp,
    Clock,
    Link as LinkIcon,
    ExternalLink,
    File,
    FilePlus,
    History,
    RefreshCw,
    Tag,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import {
    getMyProjects,
    uploadProjectDocument,
    deleteProjectDocument,
} from "./actions";
import type { MyProjectData, ProjectDocumentData } from "./actions";

// ═══════════════════════════════════════════
// ── CONSTANTS ─────────────────────────────
// ═══════════════════════════════════════════

const DOCUMENT_TYPES: Record<string, string> = {
    technical: "Documento Técnico",
    manual: "Manual",
    report: "Informe",
    minutes: "Acta",
    "trl-evaluation": "Evaluación TRL",
    other: "Otro",
};

const PROJECT_STATUS_LABELS: Record<string, string> = {
    draft: "Borrador",
    published: "Publicado",
};

const PROJECT_STATUS_COLORS: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800",
    published: "bg-green-100 text-green-800",
};

const MEETING_STATUS_LABELS: Record<string, string> = {
    programada: "Programada",
    realizada: "Realizada",
    cancelada: "Cancelada",
};

const MEETING_STATUS_COLORS: Record<string, string> = {
    programada: "bg-blue-100 text-blue-800",
    realizada: "bg-green-100 text-green-800",
    cancelada: "bg-red-100 text-red-800",
};

const DOC_TYPE_ICONS: Record<string, string> = {
    technical: "📐",
    manual: "📖",
    report: "📊",
    minutes: "📝",
    "trl-evaluation": "🎯",
    other: "📄",
};

// ═══════════════════════════════════════════
// ── PAGE COMPONENT ────────────────────────
// ═══════════════════════════════════════════

export default function MisProyectosPage() {
    const [projects, setProjects] = useState<MyProjectData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<Record<string, string>>({});

    // Upload document
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [uploadProjectId, setUploadProjectId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadForm, setUploadForm] = useState({
        title: "",
        documentType: "technical",
        description: "",
        version: "1.0",
        versionNotes: "",
        file: null as File | null,
        previousVersion: "",
    });

    // Version history
    const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
    const [historyDocuments, setHistoryDocuments] = useState<ProjectDocumentData[]>([]);
    const [historyTitle, setHistoryTitle] = useState("");

    // ── Data Loading ──

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await getMyProjects();
            setProjects(data);
        } catch (error) {
            console.error("Error cargando proyectos:", error);
            toast.error("Error al cargar proyectos");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ── Helpers ──

    const toggleProject = (id: string) => {
        setExpandedProjectId((prev) => (prev === id ? null : id));
    };

    const getSectionForProject = (projectId: string) => {
        return activeSection[projectId] || "info";
    };

    const setSectionForProject = (projectId: string, section: string) => {
        setActiveSection((prev) => ({ ...prev, [projectId]: section }));
    };

    const filteredProjects = projects.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ── Upload handlers ──

    const openUploadDialog = (projectId: string) => {
        setUploadProjectId(projectId);
        setUploadForm({
            title: "",
            documentType: "technical",
            description: "",
            version: "1.0",
            versionNotes: "",
            file: null,
            previousVersion: "",
        });
        setIsUploadDialogOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadForm((prev) => ({
                ...prev,
                file,
                title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
            }));
        }
    };

    const handleUpload = async () => {
        if (!uploadProjectId || !uploadForm.file) {
            toast.error("Selecciona un archivo");
            return;
        }
        setIsUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", uploadForm.file);
            fd.append("title", uploadForm.title);
            fd.append("documentType", uploadForm.documentType);
            fd.append("description", uploadForm.description);
            fd.append("version", uploadForm.version);
            fd.append("versionNotes", uploadForm.versionNotes);
            if (uploadForm.previousVersion) {
                fd.append("previousVersion", uploadForm.previousVersion);
            }
            const result = await uploadProjectDocument(uploadProjectId, fd);
            if (result.success) {
                toast.success("Documento subido exitosamente");
                setIsUploadDialogOpen(false);
                loadData();
            } else {
                toast.error(result.error || "Error al subir documento");
            }
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Error al subir documento");
        } finally {
            setIsUploading(false);
        }
    };

    // ── Delete document ──

    const handleDeleteDocument = async (docId: string) => {
        if (!confirm("¿Estás seguro de eliminar este documento?")) return;
        try {
            const result = await deleteProjectDocument(docId);
            if (result.success) {
                toast.success("Documento eliminado");
                loadData();
            } else {
                toast.error(result.error || "Error al eliminar");
            }
        } catch {
            toast.error("Error al eliminar documento");
        }
    };

    // ── Version history ──

    const openVersionHistory = (doc: ProjectDocumentData, project: MyProjectData) => {
        // Find all docs for same title & docType
        const relatedDocs = project.documents
            .filter(
                (d) =>
                    d.title === doc.title && d.documentType === doc.documentType
            )
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        setHistoryDocuments(relatedDocs.length > 0 ? relatedDocs : [doc]);
        setHistoryTitle(doc.title);
        setIsHistoryDialogOpen(true);
    };

    // ═══════════════════════════════════════════
    // ── RENDER ─────────────────────────────────
    // ═══════════════════════════════════════════

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
                    <p className="text-gray-500">Cargando tus proyectos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-xl">
                            <FolderTree className="h-7 w-7 text-orange-600" />
                        </div>
                        Mis Proyectos
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Consulta los detalles de tus proyectos y gestiona documentos
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={loadData}
                    className="gap-2"
                >
                    <RefreshCw className="h-4 w-4" />
                    Actualizar
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Buscar proyecto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* No projects */}
            {filteredProjects.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <FolderTree className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">
                            {searchQuery
                                ? "No se encontraron proyectos con ese nombre."
                                : "No tienes proyectos asignados aún."}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Projects List */}
            {filteredProjects.map((project) => {
                const isExpanded = expandedProjectId === project.id;
                const section = getSectionForProject(project.id);

                return (
                    <Card key={project.id} className="overflow-hidden">
                        {/* Project Header (click to expand) */}
                        <CardHeader
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => toggleProject(project.id)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {project.featuredImage && (
                                        <Image
                                            src={project.featuredImage}
                                            alt={project.title}
                                            width={56}
                                            height={56}
                                            className="h-14 w-14 rounded-lg object-cover"
                                        />
                                    )}
                                    <div>
                                        <CardTitle className="text-lg">
                                            {project.title}
                                        </CardTitle>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <Badge
                                                className={
                                                    PROJECT_STATUS_COLORS[project.status] ||
                                                    "bg-gray-100 text-gray-800"
                                                }
                                            >
                                                {PROJECT_STATUS_LABELS[project.status] || project.status}
                                            </Badge>
                                            <Badge variant="outline">{project.category}</Badge>
                                            <span className="text-sm text-gray-500">
                                                {project.year}
                                            </span>
                                            {project.documents.length > 0 && (
                                                <Badge variant="secondary" className="gap-1">
                                                    <FileText className="h-3 w-3" />
                                                    {project.documents.length} docs
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {isExpanded ? (
                                    <ChevronUp className="h-5 w-5 text-gray-400" />
                                ) : (
                                    <ChevronDown className="h-5 w-5 text-gray-400" />
                                )}
                            </div>
                        </CardHeader>

                        {/* Expanded Content */}
                        {isExpanded && (
                            <CardContent className="border-t pt-4">
                                {/* Section Tabs */}
                                <div className="flex gap-1 mb-4 flex-wrap border-b pb-2">
                                    {[
                                        { key: "info", label: "Información", icon: Eye },
                                        {
                                            key: "documents",
                                            label: `Documentos (${project.documents.length})`,
                                            icon: FileText,
                                        },
                                        {
                                            key: "meetings",
                                            label: `Reuniones (${project.meetings.length})`,
                                            icon: CalendarDays,
                                        },
                                    ].map((tab) => (
                                        <Button
                                            key={tab.key}
                                            variant={
                                                section === tab.key ? "default" : "ghost"
                                            }
                                            size="sm"
                                            className="gap-1.5"
                                            onClick={() =>
                                                setSectionForProject(project.id, tab.key)
                                            }
                                        >
                                            <tab.icon className="h-4 w-4" />
                                            {tab.label}
                                        </Button>
                                    ))}
                                </div>

                                {/* ── Info Section ── */}
                                {section === "info" && (
                                    <div className="space-y-4">
                                        {/* Description */}
                                        {project.description && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-700 mb-1">
                                                    Descripción
                                                </h4>
                                                <p className="text-sm text-gray-600 whitespace-pre-line">
                                                    {project.description}
                                                </p>
                                            </div>
                                        )}

                                        {/* Dates */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {project.startDate && (
                                                <div>
                                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                                        <CalendarDays className="h-3 w-3" />
                                                        Fecha inicio
                                                    </span>
                                                    <span className="text-sm font-medium">
                                                        {new Date(project.startDate).toLocaleDateString(
                                                            "es-CL"
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                            {project.endDate && (
                                                <div>
                                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                                        <CalendarDays className="h-3 w-3" />
                                                        Fecha fin
                                                    </span>
                                                    <span className="text-sm font-medium">
                                                        {new Date(project.endDate).toLocaleDateString(
                                                            "es-CL"
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Technologies */}
                                        {project.technologies.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                                                    <Tag className="h-3.5 w-3.5" />
                                                    Tecnologías
                                                </h4>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {project.technologies.map((tech, i) => (
                                                        <Badge
                                                            key={i}
                                                            variant="secondary"
                                                            className="text-xs"
                                                        >
                                                            {tech}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Creators */}
                                        {project.creators.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                                                    <Users className="h-3.5 w-3.5" />
                                                    Creadores
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {project.creators.map((c, i) => (
                                                        <Badge
                                                            key={i}
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {c.name}
                                                            {c.role && (
                                                                <span className="text-gray-400 ml-1">
                                                                    ({c.role})
                                                                </span>
                                                            )}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Links */}
                                        {project.links.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                                                    <LinkIcon className="h-3.5 w-3.5" />
                                                    Enlaces
                                                </h4>
                                                <div className="space-y-1">
                                                    {project.links.map((link, i) => (
                                                        <a
                                                            key={i}
                                                            href={link.url.match(/^https?:\/\//) ? link.url : `https://${link.url}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                            {link.label || link.url}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── Documents Section ── */}
                                {section === "documents" && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-gray-700">
                                                Documentos del Proyecto
                                            </h4>
                                            <Button
                                                size="sm"
                                                className="gap-1.5"
                                                onClick={() => openUploadDialog(project.id)}
                                            >
                                                <FilePlus className="h-4 w-4" />
                                                Subir Documento
                                            </Button>
                                        </div>

                                        {project.documents.length === 0 ? (
                                            <div className="text-center py-8 border rounded-lg bg-gray-50">
                                                <FileText className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                                                <p className="text-sm text-gray-500">
                                                    Aún no hay documentos en este proyecto.
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-2 gap-1"
                                                    onClick={() =>
                                                        openUploadDialog(project.id)
                                                    }
                                                >
                                                    <Upload className="h-4 w-4" />
                                                    Subir el primero
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="border rounded-lg overflow-hidden">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-gray-50">
                                                            <TableHead className="w-[50px]">
                                                                Tipo
                                                            </TableHead>
                                                            <TableHead>
                                                                Título
                                                            </TableHead>
                                                            <TableHead className="w-[80px]">
                                                                Versión
                                                            </TableHead>
                                                            <TableHead className="w-[150px]">
                                                                Fecha
                                                            </TableHead>
                                                            <TableHead className="w-[120px]">
                                                                Subido por
                                                            </TableHead>
                                                            <TableHead className="w-[150px] text-right">
                                                                Acciones
                                                            </TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {project.documents.map((doc) => (
                                                            <TableRow key={doc.id}>
                                                                <TableCell className="font-mono text-center text-lg">
                                                                    {DOC_TYPE_ICONS[doc.documentType] || "📄"}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div>
                                                                        <div className="font-medium text-sm">
                                                                            {doc.title}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">
                                                                            {DOCUMENT_TYPES[doc.documentType] || doc.documentType}
                                                                        </div>
                                                                        {doc.description && (
                                                                            <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[300px]">
                                                                                {doc.description}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="text-xs"
                                                                    >
                                                                        v{doc.version}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-xs text-gray-500">
                                                                    {new Date(
                                                                        doc.createdAt
                                                                    ).toLocaleDateString("es-CL", {
                                                                        day: "2-digit",
                                                                        month: "short",
                                                                        year: "numeric",
                                                                    })}
                                                                </TableCell>
                                                                <TableCell className="text-xs text-gray-500">
                                                                    {doc.uploadedBy}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex items-center justify-end gap-1">
                                                                        {doc.fileUrl && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-7 w-7 p-0"
                                                                                onClick={() =>
                                                                                    window.open(
                                                                                        doc.fileUrl!,
                                                                                        "_blank"
                                                                                    )
                                                                                }
                                                                                title="Descargar"
                                                                            >
                                                                                <Download className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        )}
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-7 w-7 p-0"
                                                                            onClick={() =>
                                                                                openVersionHistory(
                                                                                    doc,
                                                                                    project
                                                                                )
                                                                            }
                                                                            title="Historial de versiones"
                                                                        >
                                                                            <History className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                                                            onClick={() =>
                                                                                handleDeleteDocument(
                                                                                    doc.id
                                                                                )
                                                                            }
                                                                            title="Eliminar"
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}

                                        {/* Document type legend */}
                                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 border-t pt-3">
                                            {Object.entries(DOCUMENT_TYPES).map(
                                                ([key, label]) => (
                                                    <span
                                                        key={key}
                                                        className="flex items-center gap-1"
                                                    >
                                                        {DOC_TYPE_ICONS[key]} {label}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ── Meetings Section ── */}
                                {section === "meetings" && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-semibold text-gray-700">
                                            Reuniones del Proyecto
                                        </h4>

                                        {project.meetings.length === 0 ? (
                                            <div className="text-center py-8 border rounded-lg bg-gray-50">
                                                <CalendarDays className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                                                <p className="text-sm text-gray-500">
                                                    No hay reuniones registradas.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {project.meetings.map((meeting) => (
                                                    <div
                                                        key={meeting.id}
                                                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border"
                                                    >
                                                        <div className="flex-shrink-0 mt-0.5">
                                                            <CalendarDays className="h-5 w-5 text-blue-500" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="text-sm font-medium">
                                                                    {new Date(
                                                                        meeting.date
                                                                    ).toLocaleDateString(
                                                                        "es-CL",
                                                                        {
                                                                            weekday: "long",
                                                                            day: "numeric",
                                                                            month: "long",
                                                                            year: "numeric",
                                                                        }
                                                                    )}
                                                                </span>
                                                                {meeting.time && (
                                                                    <span className="text-xs text-gray-500 flex items-center gap-0.5">
                                                                        <Clock className="h-3 w-3" />
                                                                        {meeting.time}
                                                                    </span>
                                                                )}
                                                                <Badge
                                                                    className={`text-xs ${
                                                                        MEETING_STATUS_COLORS[
                                                                            meeting.status
                                                                        ] ||
                                                                        "bg-gray-100 text-gray-800"
                                                                    }`}
                                                                >
                                                                    {MEETING_STATUS_LABELS[
                                                                        meeting.status
                                                                    ] || meeting.status}
                                                                </Badge>
                                                            </div>
                                                            {meeting.description && (
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    {meeting.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        )}
                    </Card>
                );
            })}

            {/* ═══════════════════════════════════════════
                ── UPLOAD DIALOG ─────────────────────────
                ═══════════════════════════════════════════ */}
            <Dialog
                open={isUploadDialogOpen}
                onOpenChange={setIsUploadDialogOpen}
            >
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Subir Documento
                        </DialogTitle>
                        <DialogDescription>
                            Sube un documento técnico, manual, informe, acta o evaluación TRL.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* File */}
                        <div>
                            <Label>Archivo *</Label>
                            <div className="mt-1">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.zip,.rar,.7z,.png,.jpg,.jpeg,.svg"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full justify-start gap-2"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="h-4 w-4" />
                                    {uploadForm.file
                                        ? uploadForm.file.name
                                        : "Seleccionar archivo..."}
                                </Button>
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <Label>Título del documento</Label>
                            <Input
                                value={uploadForm.title}
                                onChange={(e) =>
                                    setUploadForm((prev) => ({
                                        ...prev,
                                        title: e.target.value,
                                    }))
                                }
                                placeholder="Nombre descriptivo del documento"
                            />
                        </div>

                        {/* Document Type */}
                        <div>
                            <Label>Tipo de documento</Label>
                            <Select
                                value={uploadForm.documentType}
                                onValueChange={(val) =>
                                    setUploadForm((prev) => ({
                                        ...prev,
                                        documentType: val,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(DOCUMENT_TYPES).map(
                                        ([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {DOC_TYPE_ICONS[key]} {label}
                                            </SelectItem>
                                        )
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Version */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Versión</Label>
                                <Input
                                    value={uploadForm.version}
                                    onChange={(e) =>
                                        setUploadForm((prev) => ({
                                            ...prev,
                                            version: e.target.value,
                                        }))
                                    }
                                    placeholder="1.0"
                                />
                            </div>
                            <div>
                                <Label>Versión anterior (opcional)</Label>
                                <Select
                                    value={uploadForm.previousVersion}
                                    onValueChange={(val) =>
                                        setUploadForm((prev) => ({
                                            ...prev,
                                            previousVersion: val === "none" ? "" : val,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Ninguna" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Ninguna</SelectItem>
                                        {uploadProjectId &&
                                            projects
                                                .find(
                                                    (p) => p.id === uploadProjectId
                                                )
                                                ?.documents.map((d) => (
                                                    <SelectItem
                                                        key={d.id}
                                                        value={d.id}
                                                    >
                                                        {d.title} (v{d.version})
                                                    </SelectItem>
                                                ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Version Notes */}
                        <div>
                            <Label>Notas de versión (opcional)</Label>
                            <Input
                                value={uploadForm.versionNotes}
                                onChange={(e) =>
                                    setUploadForm((prev) => ({
                                        ...prev,
                                        versionNotes: e.target.value,
                                    }))
                                }
                                placeholder="Cambios en esta versión..."
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <Label>Descripción (opcional)</Label>
                            <Textarea
                                value={uploadForm.description}
                                onChange={(e) =>
                                    setUploadForm((prev) => ({
                                        ...prev,
                                        description: e.target.value,
                                    }))
                                }
                                placeholder="Breve descripción del contenido"
                                rows={2}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsUploadDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={isUploading || !uploadForm.file}
                            className="gap-2"
                        >
                            {isUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Upload className="h-4 w-4" />
                            )}
                            {isUploading ? "Subiendo..." : "Subir Documento"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══════════════════════════════════════════
                ── VERSION HISTORY DIALOG ────────────────
                ═══════════════════════════════════════════ */}
            <Dialog
                open={isHistoryDialogOpen}
                onOpenChange={setIsHistoryDialogOpen}
            >
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Historial de Versiones
                        </DialogTitle>
                        <DialogDescription>{historyTitle}</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2 max-h-[400px] overflow-y-auto">
                        {historyDocuments.map((doc, idx) => (
                            <div
                                key={doc.id}
                                className={`p-3 rounded-lg border ${
                                    idx === 0
                                        ? "border-orange-200 bg-orange-50"
                                        : "bg-gray-50"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={idx === 0 ? "default" : "outline"}
                                            className="text-xs"
                                        >
                                            v{doc.version}
                                        </Badge>
                                        {idx === 0 && (
                                            <span className="text-xs text-orange-600 font-medium">
                                                Actual
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {new Date(doc.createdAt).toLocaleDateString(
                                            "es-CL",
                                            {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            }
                                        )}
                                    </span>
                                </div>
                                {doc.versionNotes && (
                                    <p className="text-xs text-gray-600 mt-1">
                                        {doc.versionNotes}
                                    </p>
                                )}
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-gray-400">
                                        por {doc.uploadedBy}
                                    </span>
                                    {doc.fileUrl && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-xs gap-1"
                                            onClick={() =>
                                                window.open(doc.fileUrl!, "_blank")
                                            }
                                        >
                                            <Download className="h-3 w-3" />
                                            Descargar
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
