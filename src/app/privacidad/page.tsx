import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

export const metadata: Metadata = {
  title: "Política de privacidad — Linko Agent",
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNav />

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Política de privacidad</h1>
        <p className="mt-2 text-[13px] text-faint">Última actualización: julio de 2026</p>

        <div className="mt-10 flex flex-col gap-8 text-[14.5px] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">1. Quiénes somos</h2>
            <p className="mt-2">
              Linko Agent ("nosotros", "la plataforma") es un servicio que permite a empresas crear y administrar
              agentes de inteligencia artificial para atender WhatsApp, Instagram y Messenger. El responsable del
              tratamiento de los datos descriptos en esta política es Linko Agent, contactable en{" "}
              <a href="mailto:hola@linkoagent.com" className="text-primary hover:underline">
                hola@linkoagent.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">2. Qué datos recopilamos</h2>
            <p className="mt-2">Recopilamos dos grandes categorías de datos:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>
                <span className="text-foreground">Datos de tu cuenta:</span> nombre, email, nombre de tu empresa,
                contraseña (almacenada encriptada, nunca en texto plano) y datos de uso de la plataforma.
              </li>
              <li>
                <span className="text-foreground">Datos de las conversaciones que gestionás:</span> número de
                teléfono, nombre de perfil y mensajes de los clientes que te escriben por WhatsApp, Instagram o
                Messenger, necesarios para que el agente de IA pueda responder.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">3. Para qué usamos estos datos</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Prestar el servicio: generar y enviar las respuestas de tu agente de IA.</li>
              <li>Mostrarte métricas, historial de conversaciones y uso de tu plan dentro del panel.</li>
              <li>Enviarte emails operativos (confirmación de cuenta, recuperación de contraseña, invitaciones de equipo).</li>
              <li>Dar soporte cuando nos escribís por el formulario de contacto o por email.</li>
              <li>Facturación, cuando corresponda según tu plan.</li>
            </ul>
            <p className="mt-2">No vendemos tus datos ni los de tus clientes a terceros con fines publicitarios.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">4. Con quién compartimos datos</h2>
            <p className="mt-2">
              Para poder prestar el servicio, algunos datos pasan por proveedores externos, únicamente con ese fin:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>
                <span className="text-foreground">Groq</span>, para generar las respuestas de los agentes de IA, y{" "}
                <span className="text-foreground">Google (Gemini)</span>, para la búsqueda semántica en la base de
                conocimiento.
              </li>
              <li>
                <span className="text-foreground">Meta (WhatsApp Business Platform)</span>, para el envío y
                recepción de mensajes de WhatsApp, Instagram y Messenger.
              </li>
              <li>
                <span className="text-foreground">Resend</span>, para el envío de emails transaccionales.
              </li>
              <li>
                <span className="text-foreground">Nuestro proveedor de hosting y base de datos</span>, donde se
                almacena la información de forma encriptada.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">5. Cuánto tiempo conservamos los datos</h2>
            <p className="mt-2">
              Conservamos los datos mientras tu cuenta esté activa. Si cancelás tu cuenta, podés solicitar la
              eliminación de tus datos y los de las conversaciones asociadas escribiéndonos a{" "}
              <a href="mailto:hola@linkoagent.com" className="text-primary hover:underline">
                hola@linkoagent.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">6. Tus derechos</h2>
            <p className="mt-2">
              De acuerdo a la Ley 25.326 de Protección de Datos Personales de Argentina, tenés derecho a acceder,
              rectificar, actualizar y solicitar la eliminación de tus datos personales. La Agencia de Acceso a la
              Información Pública, en su carácter de Órgano de Control de la Ley N.º 25.326, tiene la atribución de
              atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por
              incumplimiento de las normas vigentes en materia de protección de datos personales. Para ejercer
              cualquiera de estos derechos, escribinos a{" "}
              <a href="mailto:hola@linkoagent.com" className="text-primary hover:underline">
                hola@linkoagent.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">7. Seguridad</h2>
            <p className="mt-2">
              Las contraseñas se almacenan encriptadas (hash), las conexiones a la plataforma viajan cifradas
              (HTTPS) y el acceso a los datos de cada empresa está aislado del de las demás empresas que usan
              Linko Agent.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">8. Cookies</h2>
            <p className="mt-2">
              Usamos únicamente cookies estrictamente necesarias para mantener tu sesión iniciada y recordar la
              empresa activa dentro de la plataforma. No usamos cookies de rastreo publicitario.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">9. Cambios a esta política</h2>
            <p className="mt-2">
              Podemos actualizar esta política a medida que evoluciona el producto. Si hacemos cambios
              significativos, te avisamos por email.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">10. Contacto</h2>
            <p className="mt-2">
              Ante cualquier consulta sobre esta política, escribinos a{" "}
              <a href="mailto:hola@linkoagent.com" className="text-primary hover:underline">
                hola@linkoagent.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
