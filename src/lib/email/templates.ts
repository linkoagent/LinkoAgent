// Gmail (sobre todo la app de celular) reinterpreta a su manera los colores de emails con
// fondo oscuro armados solo con <div>/CSS, y termina mostrando un fondo claro que no es el
// nuestro. La combinación de "color-scheme: light only" + tablas con bgcolor explícito (en vez
// de depender solo de background en divs) es lo que le impide a los clientes de mail reescribir
// la paleta.
function layout(bodyHtml: string) {
  return `<!DOCTYPE html>
<html lang="es" style="color-scheme: light only; supported-color-schemes: light only;">
  <head>
    <meta name="color-scheme" content="light only">
    <meta name="supported-color-schemes" content="light only">
  </head>
  <body style="margin:0; padding:0; background-color:#F7F5FC;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#F7F5FC" style="background-color:#F7F5FC;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF; max-width:480px; width:100%; border-radius:16px; border:1px solid #E5E1F5;">
            <tr>
              <td style="padding:32px; font-family: -apple-system, 'Segoe UI', sans-serif; color:#1E1B2E;">
                <div style="font-family: Georgia, serif; font-weight:700; font-size:20px; margin-bottom:24px; color:#1E1B2E;">
                  Link<span style="color:#7C4DFF;">o</span> Agent
                </div>
                ${bodyHtml}
                <p style="margin-top:32px; font-size:12px; color:#8B85A0;">
                  Linko Agent · hola@linkoagent.com
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function passwordResetEmail(params: { name: string; resetUrl: string }) {
  return layout(`
    <p style="font-size:15px; line-height:1.5;">Hola ${params.name},</p>
    <p style="font-size:15px; line-height:1.5;">
      Pediste restablecer tu contraseña de Linko Agent. Este enlace es válido por 1 hora:
    </p>
    <p style="margin:24px 0;">
      <a href="${params.resetUrl}" style="background:linear-gradient(135deg,#7C4DFF,#4C1D95); color:white; padding:12px 20px; border-radius:8px; text-decoration:none; font-size:14px;">
        Elegir nueva contraseña
      </a>
    </p>
    <p style="font-size:13px; color:#6B6580;">Si no fuiste vos, podés ignorar este email.</p>
  `);
}

export function verifyEmailEmail(params: { name: string; verifyUrl: string }) {
  return layout(`
    <p style="font-size:15px; line-height:1.5;">Hola ${params.name},</p>
    <p style="font-size:15px; line-height:1.5;">
      Gracias por crear tu cuenta en Linko Agent. Confirmá tu email para poder ingresar — este enlace es válido por 24 horas:
    </p>
    <p style="margin:24px 0;">
      <a href="${params.verifyUrl}" style="background:linear-gradient(135deg,#7C4DFF,#4C1D95); color:white; padding:12px 20px; border-radius:8px; text-decoration:none; font-size:14px;">
        Confirmar mi email
      </a>
    </p>
    <p style="font-size:13px; color:#6B6580;">Si no creaste esta cuenta, podés ignorar este email.</p>
  `);
}

export function handoffEmail(params: { name: string; customerName: string; reason: string; conversationUrl: string }) {
  return layout(`
    <p style="font-size:15px; line-height:1.5;">Hola ${params.name},</p>
    <p style="font-size:15px; line-height:1.5;">
      Una conversación con <strong>${params.customerName}</strong> necesita atención de una persona del equipo:
    </p>
    <p style="font-size:14px; line-height:1.5; color:#6B6580; border-left:2px solid #7C4DFF; padding-left:12px; margin:16px 0;">
      ${params.reason}
    </p>
    <p style="margin:24px 0;">
      <a href="${params.conversationUrl}" style="background:linear-gradient(135deg,#7C4DFF,#4C1D95); color:white; padding:12px 20px; border-radius:8px; text-decoration:none; font-size:14px;">
        Ver conversación
      </a>
    </p>
  `);
}

export function teamInviteEmail(params: { name: string; companyName: string; inviterName: string; setPasswordUrl: string }) {
  return layout(`
    <p style="font-size:15px; line-height:1.5;">Hola ${params.name},</p>
    <p style="font-size:15px; line-height:1.5;">
      ${params.inviterName} te agregó al equipo de <strong>${params.companyName}</strong> en Linko Agent.
    </p>
    <p style="margin:24px 0;">
      <a href="${params.setPasswordUrl}" style="background:linear-gradient(135deg,#7C4DFF,#4C1D95); color:white; padding:12px 20px; border-radius:8px; text-decoration:none; font-size:14px;">
        Crear mi contraseña e ingresar
      </a>
    </p>
    <p style="font-size:13px; color:#6B6580;">Este enlace es válido por 24 horas.</p>
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
    value ? `<p style="font-size:14px; margin:4px 0;"><strong style="color:#6B6580;">${label}:</strong> ${value}</p>` : "";

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
