/**
 * Interfaz agnóstica de proveedor: ni los tools de IA ni la pantalla /agenda deberían saber que
 * hoy el único proveedor es Google Calendar. Agregar Outlook/Calendly en el futuro es implementar
 * esta interfaz + un caso nuevo en providerFactory.ts, sin tocar rules.ts/service.ts.
 */
export interface AgendaProvider {
  readonly provider: string;
  getFreeBusy(params: { startUtc: Date; endUtc: Date }): Promise<{ busy: boolean }>;
  createEvent(params: {
    startUtc: Date;
    endUtc: Date;
    timezone: string;
    summary: string;
    description?: string;
  }): Promise<{ externalEventId: string }>;
  updateEvent(params: { externalEventId: string; startUtc: Date; endUtc: Date; timezone: string }): Promise<void>;
  deleteEvent(params: { externalEventId: string }): Promise<void>;
}
