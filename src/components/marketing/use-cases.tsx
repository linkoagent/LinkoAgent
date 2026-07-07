const cases = [
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
];

export function UseCases() {
  return (
    <section id="soluciones" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-14 max-w-2xl">
        <span className="font-display text-[11px] uppercase tracking-wide text-faint">Soluciones</span>
        <h2 className="mt-3 text-3xl font-bold text-foreground">Un agente distinto para cada tipo de negocio.</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cases.map((c) => (
          <div key={c.title} className="rounded-xl border border-border bg-card p-5">
            <h4 className="font-display text-[13.5px] text-foreground">{c.title}</h4>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
