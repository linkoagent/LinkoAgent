export const marketingNav = [
  { label: "Producto", href: "#producto" },
  { label: "Soluciones", href: "#soluciones" },
  { label: "Precios", href: "#precios" },
  { label: "Preguntas frecuentes", href: "#faq" },
];

export const hero = {
  eyebrow: "Agentes de IA para empresas",
  title: "Tu equipo de agentes de IA, disponible 24/7.",
  subtitle: "Conversaciones que trabajan para tu negocio.",
  body: "Automatizá WhatsApp, Instagram y Messenger con agentes de IA que responden, venden y hacen seguimiento — sin escribir código.",
  chips: ["WhatsApp", "Instagram", "Messenger", "+ web y más"],
};

export const rubros = [
  "Ecommerce",
  "Clínicas y estética",
  "Inmobiliarias",
  "Gimnasios",
  "Turismo",
  "Educación",
  "Concesionarias",
  "Servicios profesionales",
  "Restaurantes",
  "Indumentaria",
];

export const features = [
  {
    kicker: "Linko Agents",
    title: "Creá tu agente en minutos",
    body: "Generalo automáticamente a partir de la URL de tu sitio, tu catálogo o tus documentos. Ajustá el tono de tu marca y quedá listo para responder sin escribir una línea de código.",
    bullets: [
      "Generación automática desde tu sitio web",
      "Entrenamiento con catálogo, PDFs y Word",
      "Personalización total del tono de marca",
      "Listo para responder en minutos",
    ],
    cta: "Generar mi agente",
  },
  {
    kicker: "Linko Analytics",
    title: "Métricas en tiempo real",
    body: "Un dashboard que muestra qué está pasando con tus clientes ahora mismo: cuántas conversaciones hay activas, cuánto se tarda en responder y cuánto de eso se está convirtiendo en ventas.",
    bullets: [
      "Conversaciones activas y resueltas",
      "Tiempo promedio de respuesta",
      "Satisfacción estimada del cliente",
      "Uso del plan y consumo del mes",
    ],
    cta: "Explorar el dashboard",
  },
  {
    kicker: "Linko Inbox + CRM",
    title: "Todos tus canales, un solo lugar",
    body: "WhatsApp, Instagram y Messenger centralizados en una bandeja única, con historial completo, etiquetas, notas y derivación a un humano cuando la conversación lo necesita.",
    bullets: [
      "Bandeja omnicanal centralizada",
      "Historial completo por contacto",
      "Etiquetas y notas de seguimiento",
      "Derivación a humano sin perder contexto",
    ],
    cta: "Abrir el CRM",
  },
  {
    kicker: "Integraciones",
    title: "Conectado con lo que ya usás",
    body: "Linko Agent no reemplaza tus herramientas: se conecta a ellas. API oficial de WhatsApp, tu ecommerce, tu calendario y tus planillas, todo alimentando al mismo agente.",
    bullets: [
      "WhatsApp API oficial (Meta Cloud API)",
      "Tiendanube, WooCommerce y Mercado Libre",
      "Google Calendar para turnos y recordatorios",
      "Excel, Google Sheets, PDF y Word",
    ],
    cta: "Conectar herramientas",
  },
];

export const steps = [
  { n: "01", title: "Elegí tu plan", body: "Starter, Pro, Business o Enterprise — según cuántos agentes y canales necesitás." },
  { n: "02", title: "Entrená tu agente", body: "Cargá tu catálogo, tus documentos o la URL de tu sitio. Ajustamos el tono con vos." },
  { n: "03", title: "Conectá tu WhatsApp", body: "Vinculá tu número por la API oficial de Meta y empezá a responder desde el día uno." },
];

export const benefits = [
  { title: "Respondé en segundos, no en horas", body: "Ninguna consulta espera hasta que alguien tenga un hueco libre." },
  { title: "Atención real fuera de horario", body: "Las consultas de la noche y el fin de semana ya no se pierden." },
  { title: "Menos preguntas repetidas para tu equipo", body: "Tu gente se concentra en lo que un agente no puede resolver." },
  { title: "Cada conversación, medida", body: "Sabés qué se pregunta, qué se pierde y qué convierte." },
  { title: "Crece sin romperse", body: "Sumás canales y volumen sin sumar la misma cantidad de gente." },
  { title: "El trato de tu marca, no de un robot genérico", body: "El tono, el catálogo y las reglas son los tuyos." },
];

export interface MarketingPlan {
  name: string;
  price: number | null;
  setup: number | null;
  tagline: string;
  features: string[];
  featured: boolean;
}

export const plansUSD: MarketingPlan[] = [
  {
    name: "Starter",
    price: 59,
    setup: 150,
    tagline: "Para negocios chicos que quieren automatizar lo básico.",
    features: [
      "1 agente de IA",
      "1 canal conectado",
      "Hasta 500 conversaciones/mes",
      "FAQs básicas",
      "Entrenamiento inicial simple",
      "Métricas simples",
      "Respuestas fuera de horario",
      "Soporte por email",
    ],
    featured: false,
  },
  {
    name: "Pro",
    price: 179,
    setup: 400,
    tagline: "Para marcas que reciben más consultas y quieren vender más.",
    features: [
      "Hasta 3 agentes de IA",
      "Hasta 3 canales conectados",
      "Entrenamiento con documentos propios",
      "Derivación a humano",
      "Gestión de leads",
      "Métricas avanzadas y reportes mensuales",
      "Integraciones básicas",
      "Automatizaciones simples",
    ],
    featured: true,
  },
  {
    name: "Business",
    price: 429,
    setup: 800,
    tagline: "Para empresas que necesitan automatización más completa.",
    features: [
      "Agentes de IA por función, sin límite fijo",
      "Conversaciones ampliadas",
      "Inbox omnicanal completo",
      "CRM liviano y seguimiento de clientes",
      "Recuperación de oportunidades",
      "Campañas automáticas",
      "Reportes avanzados",
      "Integraciones con ecommerce y agenda",
    ],
    featured: false,
  },
  {
    name: "Enterprise",
    price: null,
    setup: null,
    tagline: "Para empresas grandes con procesos a medida.",
    features: [
      "Agentes personalizados por proceso",
      "Canales múltiples, incluida voz",
      "Integración con tu CRM",
      "Automatizaciones avanzadas",
      "Reportes personalizados",
      "Soporte prioritario y SLA",
      "Onboarding dedicado",
      "Permisos por equipo",
    ],
    featured: false,
  },
];

// Cotización de referencia — ajustar según el tipo de cambio vigente al momento de publicar.
export const usdToArs = 1450;

export const faqs = [
  { q: "¿La IA reemplaza completamente a una persona?", a: "No. Resuelve las consultas repetitivas y deriva a un humano lo que realmente necesita una persona." },
  { q: "¿Es legal usar un asistente de IA para atender por WhatsApp?", a: "Sí. Linko Agent se conecta mediante la API oficial de WhatsApp Business (Meta Cloud API), dentro de los términos de uso de Meta." },
  { q: "¿Funciona con Instagram y Messenger, o solo con WhatsApp?", a: "Los tres canales están disponibles desde el primer plan." },
  { q: "¿Necesito conocimientos técnicos para configurarlo?", a: "No. El equipo de Linko hace la configuración inicial; el día a día se maneja desde un panel simple." },
  { q: "¿Puedo pausar o controlar cuándo responde el agente?", a: "Sí, podés pausarlo por conversación o por horario, y definir cuándo debe derivar a una persona." },
  { q: "¿Qué pasa si supero el límite de conversaciones de mi plan?", a: "Se cobra un excedente por conversación adicional, o podés subir de plan en cualquier momento." },
  { q: "¿Cuánto tarda la implementación?", a: "Entre 1 y 3 semanas según el plan y la cantidad de información a entrenar." },
  { q: "¿Qué nivel de seguridad tienen mis datos?", a: "Cada cuenta está aislada: ninguna empresa accede a los datos o conversaciones de otra." },
  { q: "¿Puedo cancelar cuando quiera?", a: "Sí, la suscripción es mensual y se puede cancelar sin permanencia mínima." },
  { q: "¿Cómo se factura la suscripción?", a: "Un fee único de implementación al inicio, más el abono mensual del plan elegido, con excedentes si corresponde." },
];

export const contactChannels = [
  { label: "WhatsApp", value: "+54 9 351 762-8450", href: "https://wa.me/5493517628450" },
  { label: "Email", value: "hola@linkoagent.com", href: "mailto:hola@linkoagent.com" },
];

export const footerLinks = {
  producto: [
    { label: "Producto", href: "#producto" },
    { label: "Soluciones", href: "#soluciones" },
    { label: "Precios", href: "#precios" },
    { label: "Preguntas frecuentes", href: "#faq" },
  ],
  legal: [
    { label: "Política de privacidad", href: "#" },
    { label: "Términos y condiciones", href: "#" },
  ],
};
