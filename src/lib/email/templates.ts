function layout(bodyHtml: string) {
  return `
  <div style="font-family: -apple-system, 'Segoe UI', sans-serif; background:#0E0B1D; padding:32px; color:#EEF0FC;">
    <div style="max-width:480px; margin:0 auto; background:#171328; border-radius:16px; padding:32px; border:1px solid #2A2440;">
      <div style="font-family: Georgia, serif; font-weight:700; font-size:20px; margin-bottom:24px;">
        Link<span style="color:#8B6BFF;">o</span> <span style="color:#9C96C4; font-weight:500;">Agent</span>
      </div>
      ${bodyHtml}
      <p style="margin-top:32px; font-size:12px; color:#7679A0;">
        Linko Agent · hola@linkoagent.com
      </p>
    </div>
  </div>`;
}

export function passwordResetEmail(params: { name: string; resetUrl: string }) {
  return layout(`
    <p style="font-size:15px; line-height:1.5;">Hola ${params.name},</p>
    <p style="font-size:15px; line-height:1.5;">
      Pediste restablecer tu contraseña de Linko Agent. Este enlace es válido por 1 hora:
    </p>
    <p style="margin:24px 0;">
      <a href="${params.resetUrl}" style="background:linear-gradient(135deg,#8B6BFF,#4C1D95); color:white; padding:12px 20px; border-radius:8px; text-decoration:none; font-size:14px;">
        Elegir nueva contraseña
      </a>
    </p>
    <p style="font-size:13px; color:#9C96C4;">Si no fuiste vos, podés ignorar este email.</p>
  `);
}

export function teamInviteEmail(params: { name: string; companyName: string; inviterName: string; setPasswordUrl: string }) {
  return layout(`
    <p style="font-size:15px; line-height:1.5;">Hola ${params.name},</p>
    <p style="font-size:15px; line-height:1.5;">
      ${params.inviterName} te agregó al equipo de <strong>${params.companyName}</strong> en Linko Agent.
    </p>
    <p style="margin:24px 0;">
      <a href="${params.setPasswordUrl}" style="background:linear-gradient(135deg,#8B6BFF,#4C1D95); color:white; padding:12px 20px; border-radius:8px; text-decoration:none; font-size:14px;">
        Crear mi contraseña e ingresar
      </a>
    </p>
    <p style="font-size:13px; color:#9C96C4;">Este enlace es válido por 24 horas.</p>
  `);
}

export function contactNotificationEmail(params: {
  name: string;
  company: string;
  email: string;
  phone?: string | null;
  channel?: string | null;
  monthlyMessages?: string | null;
  industry?: string | null;
  message?: string | null;
}) {
  const row = (label: string, value?: string | null) =>
    value ? `<p style="font-size:14px; margin:4px 0;"><strong style="color:#9C96C4;">${label}:</strong> ${value}</p>` : "";

  return layout(`
    <p style="font-size:15px; line-height:1.5;">Nuevo lead desde linkoagent.com:</p>
    ${row("Nombre", params.name)}
    ${row("Empresa", params.company)}
    ${row("Email", params.email)}
    ${row("Teléfono", params.phone)}
    ${row("Canal", params.channel)}
    ${row("Mensajes/mes", params.monthlyMessages)}
    ${row("Rubro", params.industry)}
    ${row("Mensaje", params.message)}
  `);
}
