import type { Integration } from "@prisma/client";
import {
  GOOGLE_CALENDAR_PROVIDER,
  getValidAccessToken,
  queryFreeBusy,
  insertEvent,
  patchEvent,
  deleteEvent,
} from "@/lib/googleCalendar/client";
import type { AgendaProvider } from "./types";

/** Mapeo 1:1 sobre googleCalendar/client.ts, sin lógica de negocio nueva — googleCalendar/client.ts
 * no se toca, esta clase solo lo adapta a la interfaz agnóstica de proveedor. */
export class GoogleCalendarProvider implements AgendaProvider {
  readonly provider = GOOGLE_CALENDAR_PROVIDER;

  constructor(private integration: Integration) {}

  private accessToken() {
    return getValidAccessToken(this.integration);
  }

  async getFreeBusy({ startUtc, endUtc }: { startUtc: Date; endUtc: Date }) {
    const busy = await queryFreeBusy({
      accessToken: await this.accessToken(),
      calendarId: this.integration.calendarId,
      timeMin: startUtc.toISOString(),
      timeMax: endUtc.toISOString(),
    });
    return { busy: busy.length > 0 };
  }

  async createEvent({
    startUtc,
    endUtc,
    timezone,
    summary,
    description,
  }: {
    startUtc: Date;
    endUtc: Date;
    timezone: string;
    summary: string;
    description?: string;
  }) {
    const event = await insertEvent({
      accessToken: await this.accessToken(),
      calendarId: this.integration.calendarId,
      summary,
      description,
      startsAt: startUtc.toISOString(),
      endsAt: endUtc.toISOString(),
      timezone,
    });
    return { externalEventId: event.id };
  }

  async updateEvent({
    externalEventId,
    startUtc,
    endUtc,
    timezone,
  }: {
    externalEventId: string;
    startUtc: Date;
    endUtc: Date;
    timezone: string;
  }) {
    await patchEvent({
      accessToken: await this.accessToken(),
      calendarId: this.integration.calendarId,
      eventId: externalEventId,
      startsAt: startUtc.toISOString(),
      endsAt: endUtc.toISOString(),
      timezone,
    });
  }

  async deleteEvent({ externalEventId }: { externalEventId: string }) {
    await deleteEvent({
      accessToken: await this.accessToken(),
      calendarId: this.integration.calendarId,
      eventId: externalEventId,
    });
  }
}
