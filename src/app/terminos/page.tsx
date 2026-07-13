import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

export const metadata: Metadata = {
  title: "Términos y condiciones — Linko Agent",
  alternates: { canonical: "/terminos" },
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNav />

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Términos y condiciones</h1>
        <p className="mt-2 text-[13px] text-faint">Última actualización: julio de 2026</p>

        <div className="mt-10 flex flex-col gap-8 text-[14.5px] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">1. Aceptación de los términos</h2>
            <p className="mt-2">
              Al crear una cuenta o usar Linko Agent, aceptás estos Términos y Condiciones. Si no estás de acuerdo,
              no debés usar la plataforma.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">2. Descripción del servicio</h2>
            <p className="mt-2">
              Linko Agent es una plataforma que permite crear y administrar agentes de inteligencia artificial para
              atender clientes por WhatsApp e Instagram, junto con herramientas de base de conocimiento,
              inbox, métricas y administración de equipo.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">3. Tu cuenta</h2>
            <p className="mt-2">
              Sos responsable de mantener la confidencialidad de tu contraseña y de toda la actividad que ocurra
              bajo tu cuenta. Avisanos de inmediato a{" "}
              <a href="mailto:hola@linkoagent.com" className="text-primary hover:underline">
                hola@linkoagent.com
              </a>{" "}
              si sospechás un uso no autorizado.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">4. Planes, precios y facturación</h2>
            <p className="mt-2">
              Ofrecemos distintos planes según el volumen de mensajes, cantidad de agentes y canales. Podés empezar
              con el plan gratuito para probar la plataforma sin cargar tarjeta. No hay permanencia mínima: podés
              cancelar tu suscripción cuando quieras desde la plataforma.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">5. Uso aceptable</h2>
            <p className="mt-2">No podés usar Linko Agent para:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Enviar spam, mensajes masivos no solicitados o contenido engañoso.</li>
              <li>Actividades ilegales o que infrinjan derechos de terceros.</li>
              <li>
                Violar las políticas de uso de Meta / WhatsApp Business Platform, ya que el envío de mensajes
                depende de esa plataforma.
              </li>
            </ul>
            <p className="mt-2">
              Nos reservamos el derecho de suspender cuentas que incumplan estas condiciones.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">6. Respuestas generadas por IA</h2>
            <p className="mt-2">
              Los agentes de Linko Agent generan respuestas automáticas en base a la información que vos cargás.
              Aunque el sistema deriva a una persona los casos que no puede resolver, no garantizamos que cada
              respuesta generada sea 100% precisa. Sos responsable de revisar y ajustar el contenido y las
              instrucciones de tus agentes.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">7. Disponibilidad del servicio</h2>
            <p className="mt-2">
              Hacemos nuestro mejor esfuerzo para mantener la plataforma disponible, pero no garantizamos un
              porcentaje de disponibilidad (uptime) específico. Puede haber interrupciones por mantenimiento o por
              causas fuera de nuestro control (por ejemplo, caídas de Meta, Groq, Google u otros proveedores externos).
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">8. Propiedad intelectual</h2>
            <p className="mt-2">
              La plataforma, su marca y su código son propiedad de Linko Agent. El contenido que vos cargás (menús,
              precios, base de conocimiento, conversaciones) sigue siendo tuyo.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">9. Limitación de responsabilidad</h2>
            <p className="mt-2">
              Linko Agent no se responsabiliza por daños indirectos, pérdida de ventas o de datos derivados del uso
              de la plataforma, en la máxima medida permitida por la ley aplicable.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">10. Cancelación y terminación</h2>
            <p className="mt-2">
              Podés cancelar tu cuenta cuando quieras desde la plataforma. Podemos suspender o cancelar cuentas que
              incumplan estos términos, avisando previamente salvo casos de uso indebido grave.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">11. Cambios a estos términos</h2>
            <p className="mt-2">
              Podemos actualizar estos términos a medida que evoluciona el producto. Si hacemos cambios
              significativos, te avisamos por email.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">12. Ley aplicable</h2>
            <p className="mt-2">
              Estos términos se rigen por las leyes de la República Argentina. Ante cualquier consulta, escribinos a{" "}
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
