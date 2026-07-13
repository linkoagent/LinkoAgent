export type Locale = "es" | "en";

export interface MarketingPlan {
  name: string;
  price: number | null;
  setup: number | null;
  tagline: string;
  features: string[];
  featured: boolean;
}

export interface MarketingContent {
  nav: { label: string; href: string }[];
  hero: { eyebrow: string; badge: string; title: string; subtitle: string; body: string; chips: string[] };
  rubros: string[];
  features: { kicker: string; title: string; body: string; bullets: string[]; cta: string }[];
  steps: { n: string; title: string; body: string }[];
  useCases: { title: string; body: string }[];
  benefits: { title: string; body: string }[];
  plans: MarketingPlan[];
  faqs: { q: string; a: string }[];
  contactChannels: { label: string; value: string; href: string }[];
  footerLinks: {
    producto: { label: string; href: string }[];
    legal: { label: string; href: string }[];
  };
  footerTagline: string;
  copyright: (year: number) => string;
}

// Cotización de referencia — ajustar según el tipo de cambio vigente al momento de publicar.
export const usdToArs = 1450;

export const MARKETING_CONTENT: Record<Locale, MarketingContent> = {
  es: {
    nav: [
      { label: "Producto", href: "/#producto" },
      { label: "Soluciones", href: "/#soluciones" },
      { label: "Precios", href: "/#precios" },
      { label: "Preguntas frecuentes", href: "/#faq" },
    ],
    hero: {
      eyebrow: "Agentes de IA para empresas",
      badge: "Meta Tech Provider certificado",
      title: "Tu equipo de agentes de IA, disponible 24/7.",
      subtitle: "Conversaciones que trabajan para tu negocio.",
      body: "Automatizá WhatsApp e Instagram con agentes de IA que responden, venden y hacen seguimiento — sin escribir código.",
      chips: ["WhatsApp", "Instagram"],
    },
    rubros: [
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
    ],
    features: [
      {
        kicker: "Linko Agents",
        title: "Creá tu agente en minutos",
        body: "Definí su rol, su tono de marca y sus reglas de negocio, y sumale las FAQs y la información de tu empresa. Nuestro equipo te acompaña en la configuración inicial.",
        bullets: [
          "Configuración guiada por el equipo de Linko",
          "Entrenamiento con FAQs, texto propio, Word, Excel y CSV",
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
        body: "WhatsApp e Instagram centralizados en una bandeja única, con historial completo, etiquetas, notas y derivación a un humano cuando la conversación lo necesita.",
        bullets: [
          "Bandeja centralizada de WhatsApp e Instagram",
          "Historial completo por contacto",
          "Etiquetas y notas de seguimiento",
          "Derivación a humano sin perder contexto",
        ],
        cta: "Abrir el CRM",
      },
    ],
    steps: [
      { n: "01", title: "Elegí tu plan", body: "Starter, Pro, Business o Enterprise — según cuántos agentes y canales necesitás." },
      { n: "02", title: "Entrená tu agente", body: "Contanos sobre tu negocio: horarios, FAQs y tono de marca. Armamos el agente inicial con vos." },
      { n: "03", title: "Conectá tu WhatsApp", body: "Vinculá tu número por la API oficial de Meta y empezá a responder desde el día uno." },
    ],
    useCases: [
      { title: "Tiendas online", body: "Responde consultas de stock y estado de pedidos en segundos." },
      { title: "Restaurantes", body: "Toma reservas y pedidos sin dejar sonando el teléfono en hora pico." },
      { title: "Clínicas", body: "Responde consultas de turnos y disponibilidad al instante." },
      { title: "Estéticas", body: "Responde consultas de turnos y promociona servicios sin ocupar a la recepción." },
      { title: "Inmobiliarias", body: "Califica interesados y coordina visitas antes de que se enfríen." },
      { title: "Educación", body: "Responde consultas de inscripción a toda hora, en temporada alta." },
      { title: "Gimnasios", body: "Responde consultas de planes, altas y vencimiento de cuota." },
      { title: "Servicios profesionales", body: "Filtra consultas antes de que lleguen a tu agenda." },
      { title: "Indumentaria", body: "Responde talles y stock al instante, donde tus clientes ya te escriben." },
      { title: "Concesionarias", body: "Califica interesados en modelos y deriva a ventas solo los leads calientes." },
      { title: "Turismo", body: "Cotiza paquetes y responde disponibilidad fuera de horario de oficina." },
      { title: "Agencias", body: "Centraliza clientes de distintas marcas en un solo panel administrador." },
    ],
    benefits: [
      { title: "Respondé en segundos, no en horas", body: "Ninguna consulta espera hasta que alguien tenga un hueco libre." },
      { title: "Atención real fuera de horario", body: "Las consultas de la noche y el fin de semana ya no se pierden." },
      { title: "Menos preguntas repetidas para tu equipo", body: "Tu gente se concentra en lo que un agente no puede resolver." },
      { title: "Cada conversación, medida", body: "Sabés qué se pregunta, qué se pierde y qué convierte." },
      { title: "Crece sin romperse", body: "Sumás canales y volumen sin sumar la misma cantidad de gente." },
      { title: "El trato de tu marca, no de un robot genérico", body: "El tono, el catálogo y las reglas son los tuyos." },
    ],
    plans: [
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
          "Entrenamiento con documentos propios (Word, Excel)",
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
          "Onboarding asistido por el equipo de Linko",
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
    ],
    faqs: [
      { q: "¿La IA reemplaza completamente a una persona?", a: "No. Resuelve las consultas repetitivas y deriva a un humano lo que realmente necesita una persona." },
      { q: "¿Es legal usar un asistente de IA para atender por WhatsApp?", a: "Sí. Linko Agent se conecta mediante la API oficial de WhatsApp Business (Meta Cloud API), dentro de los términos de uso de Meta." },
      { q: "¿Funciona con Instagram, o solo con WhatsApp?", a: "Funciona con WhatsApp e Instagram." },
      { q: "¿Necesito conocimientos técnicos para configurarlo?", a: "No. El equipo de Linko hace la configuración inicial; el día a día se maneja desde un panel simple." },
      { q: "¿Puedo pausar o controlar cuándo responde el agente?", a: "Sí, podés pausarlo por conversación o por horario, y definir cuándo debe derivar a una persona." },
      { q: "¿Qué pasa si supero el límite de conversaciones de mi plan?", a: "Se cobra un excedente por conversación adicional, o podés subir de plan en cualquier momento." },
      { q: "¿Cuánto tarda la implementación?", a: "Entre 1 y 3 semanas según el plan y la cantidad de información a entrenar." },
      { q: "¿Qué nivel de seguridad tienen mis datos?", a: "Cada cuenta está aislada: ninguna empresa accede a los datos o conversaciones de otra." },
      { q: "¿Puedo cancelar cuando quiera?", a: "Sí, la suscripción es mensual y se puede cancelar sin permanencia mínima." },
      { q: "¿Cómo se factura la suscripción?", a: "Un fee único de implementación al inicio, más el abono mensual del plan elegido, con excedentes si corresponde." },
    ],
    contactChannels: [
      { label: "WhatsApp", value: "+54 9 351 636-2806", href: "https://wa.me/5493516362806" },
      { label: "Email", value: "hola@linkoagent.com", href: "mailto:hola@linkoagent.com" },
      { label: "Instagram", value: "@linkoagent", href: "https://instagram.com/linkoagent" },
    ],
    footerLinks: {
      producto: [
        { label: "Producto", href: "/#producto" },
        { label: "Soluciones", href: "/#soluciones" },
        { label: "Precios", href: "/#precios" },
        { label: "Preguntas frecuentes", href: "/#faq" },
      ],
      legal: [
        { label: "Política de privacidad", href: "/privacidad" },
        { label: "Términos y condiciones", href: "/terminos" },
      ],
    },
    footerTagline:
      "La plataforma de agentes de IA que conecta empresas con clientes, automatiza conversaciones y convierte mensajes en ventas.",
    copyright: (year) => `© ${year} Linko Agent. Todos los derechos reservados.`,
  },
  en: {
    nav: [
      { label: "Product", href: "/#producto" },
      { label: "Solutions", href: "/#soluciones" },
      { label: "Pricing", href: "/#precios" },
      { label: "FAQ", href: "/#faq" },
    ],
    hero: {
      eyebrow: "AI agents for businesses",
      badge: "Certified Meta Tech Provider",
      title: "Your team of AI agents, available 24/7.",
      subtitle: "Conversations that work for your business.",
      body: "Automate WhatsApp and Instagram with AI agents that answer, sell, and follow up — no code required.",
      chips: ["WhatsApp", "Instagram"],
    },
    rubros: [
      "Ecommerce",
      "Clinics & aesthetics",
      "Real estate",
      "Gyms",
      "Travel",
      "Education",
      "Car dealerships",
      "Professional services",
      "Restaurants",
      "Apparel",
    ],
    features: [
      {
        kicker: "Linko Agents",
        title: "Build your agent in minutes",
        body: "Define its role, brand tone, and business rules, and add your FAQs and company information. Our team helps you with the initial setup.",
        bullets: [
          "Guided setup by the Linko team",
          "Trained on FAQs, your own text, Word, Excel, and CSV",
          "Full brand tone customization",
          "Ready to respond in minutes",
        ],
        cta: "Build my agent",
      },
      {
        kicker: "Linko Analytics",
        title: "Real-time metrics",
        body: "A dashboard that shows what's happening with your customers right now: how many conversations are active, how long it takes to respond, and how much of that is turning into sales.",
        bullets: [
          "Active and resolved conversations",
          "Average response time",
          "Estimated customer satisfaction",
          "Plan usage and monthly consumption",
        ],
        cta: "Explore the dashboard",
      },
      {
        kicker: "Linko Inbox + CRM",
        title: "All your channels, one place",
        body: "WhatsApp and Instagram centralized in a single inbox, with full history, tags, notes, and handoff to a human whenever the conversation needs it.",
        bullets: [
          "Centralized WhatsApp and Instagram inbox",
          "Full history per contact",
          "Tags and follow-up notes",
          "Handoff to a human without losing context",
        ],
        cta: "Open the CRM",
      },
    ],
    steps: [
      { n: "01", title: "Choose your plan", body: "Starter, Pro, Business, or Enterprise — based on how many agents and channels you need." },
      { n: "02", title: "Train your agent", body: "Tell us about your business: hours, FAQs, and brand tone. We build the initial agent together with you." },
      { n: "03", title: "Connect your WhatsApp", body: "Link your number through the official Meta API and start responding from day one." },
    ],
    useCases: [
      { title: "Online stores", body: "Answers stock and order-status questions in seconds." },
      { title: "Restaurants", body: "Takes reservations and orders without tying up the phone during rush hour." },
      { title: "Clinics", body: "Answers appointment and availability questions instantly." },
      { title: "Beauty salons", body: "Answers appointment questions and promotes services without occupying the front desk." },
      { title: "Real estate", body: "Qualifies leads and coordinates visits before they go cold." },
      { title: "Education", body: "Answers enrollment questions around the clock, during peak season." },
      { title: "Gyms", body: "Answers questions about plans, sign-ups, and membership renewals." },
      { title: "Professional services", body: "Filters inquiries before they reach your calendar." },
      { title: "Apparel", body: "Answers sizing and stock questions instantly, wherever your customers already message you." },
      { title: "Car dealerships", body: "Qualifies interest in models and routes only hot leads to sales." },
      { title: "Travel", body: "Quotes packages and answers availability outside office hours." },
      { title: "Agencies", body: "Centralizes clients from different brands in a single admin panel." },
    ],
    benefits: [
      { title: "Respond in seconds, not hours", body: "No inquiry waits until someone has a free moment." },
      { title: "Real support outside business hours", body: "Nighttime and weekend inquiries are no longer lost." },
      { title: "Fewer repeated questions for your team", body: "Your people focus on what an agent can't solve." },
      { title: "Every conversation, measured", body: "You know what's asked, what's lost, and what converts." },
      { title: "Grows without breaking", body: "Add channels and volume without adding the same amount of people." },
      { title: "Your brand's voice, not a generic bot", body: "The tone, the catalog, and the rules are yours." },
    ],
    plans: [
      {
        name: "Starter",
        price: 59,
        setup: 150,
        tagline: "For small businesses that want to automate the basics.",
        features: [
          "1 AI agent",
          "1 connected channel",
          "Up to 500 conversations/month",
          "Basic FAQs",
          "Simple initial training",
          "Simple metrics",
          "After-hours replies",
          "Email support",
        ],
        featured: false,
      },
      {
        name: "Pro",
        price: 179,
        setup: 400,
        tagline: "For brands getting more inquiries who want to sell more.",
        features: [
          "Up to 3 AI agents",
          "Up to 3 connected channels",
          "Training with your own documents (Word, Excel)",
          "Human handoff",
          "Lead management",
          "Advanced metrics and monthly reports",
          "Basic integrations",
          "Simple automations",
        ],
        featured: true,
      },
      {
        name: "Business",
        price: 429,
        setup: 800,
        tagline: "For companies that need more complete automation.",
        features: [
          "AI agents by function, no fixed limit",
          "Expanded conversations",
          "Full omnichannel inbox",
          "Lightweight CRM and customer follow-up",
          "Lead recovery",
          "Automated campaigns",
          "Advanced reports",
          "Assisted onboarding by the Linko team",
        ],
        featured: false,
      },
      {
        name: "Enterprise",
        price: null,
        setup: null,
        tagline: "For large companies with custom-built processes.",
        features: [
          "Custom agents per process",
          "Multiple channels, including voice",
          "Integration with your CRM",
          "Advanced automations",
          "Custom reports",
          "Priority support and SLA",
          "Dedicated onboarding",
          "Team-based permissions",
        ],
        featured: false,
      },
    ],
    faqs: [
      { q: "Does the AI fully replace a person?", a: "No. It resolves repetitive inquiries and hands off to a human whatever genuinely needs a person." },
      { q: "Is it legal to use an AI assistant to handle WhatsApp?", a: "Yes. Linko Agent connects through the official WhatsApp Business API (Meta Cloud API), within Meta's terms of use." },
      { q: "Does it work with Instagram, or only WhatsApp?", a: "It works with WhatsApp and Instagram." },
      { q: "Do I need technical knowledge to set it up?", a: "No. The Linko team handles the initial setup; day-to-day is managed from a simple panel." },
      { q: "Can I pause or control when the agent responds?", a: "Yes, you can pause it per conversation or by schedule, and define when it should hand off to a person." },
      { q: "What happens if I go over my plan's conversation limit?", a: "An overage fee is charged per additional conversation, or you can upgrade your plan at any time." },
      { q: "How long does implementation take?", a: "Between 1 and 3 weeks depending on the plan and the amount of information to train on." },
      { q: "How secure is my data?", a: "Each account is isolated: no company can access another's data or conversations." },
      { q: "Can I cancel anytime?", a: "Yes, the subscription is monthly and can be canceled with no minimum commitment." },
      { q: "How is the subscription billed?", a: "A one-time implementation fee upfront, plus the monthly fee for the chosen plan, with overages if applicable." },
    ],
    contactChannels: [
      { label: "WhatsApp", value: "+54 9 351 636-2806", href: "https://wa.me/5493516362806" },
      { label: "Email", value: "hola@linkoagent.com", href: "mailto:hola@linkoagent.com" },
      { label: "Instagram", value: "@linkoagent", href: "https://instagram.com/linkoagent" },
    ],
    footerLinks: {
      producto: [
        { label: "Product", href: "/#producto" },
        { label: "Solutions", href: "/#soluciones" },
        { label: "Pricing", href: "/#precios" },
        { label: "FAQ", href: "/#faq" },
      ],
      legal: [
        { label: "Privacy policy", href: "/privacidad" },
        { label: "Terms and conditions", href: "/terminos" },
      ],
    },
    footerTagline:
      "The AI agent platform that connects businesses with customers, automates conversations, and turns messages into sales.",
    copyright: (year) => `© ${year} Linko Agent. All rights reserved.`,
  },
};
