import { NextResponse } from 'next/server';
import { createNotificationsApi } from '@kit/notifications/api';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { getMailer } from '@kit/mailers';

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    const account_id: string | undefined = payload?.account_id;
    const body: string | undefined = payload?.body;
    const link: string | undefined = payload?.link;
    const type: 'info' | 'warning' | 'error' | undefined = payload?.type;
    const channel: 'in_app' | 'email' | undefined = payload?.channel;

    if (!account_id || !body) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: account_id and body' },
        { status: 400 },
      );
    }

    const adminClient = getSupabaseServerAdminClient();
    const api = createNotificationsApi(adminClient);

    await api.createNotification({
      account_id,
      body,
      link,
      type: type ?? 'info',
      channel: channel ?? 'in_app',
    });

    // send email to the authenticated user as well
    let emailSent = false;
    try {
      const client = getSupabaseServerClient();
      const { data: userData } = await client.auth.getUser();
      const userEmail = userData?.user?.email;

      if (userEmail) {
        const mailer = await getMailer();
        await mailer.sendEmail({
          to: userEmail,
          from: process.env.EMAIL_SENDER ?? 'Makerkit <noreply@makerkit.dev>',
          subject: 'Nuevo paciente registrado',
          html: `
            <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
              <p>${body}</p>
              ${link ? `<p><a href="${link}" target="_blank" rel="noopener noreferrer">Ver historial clínico</a></p>` : ''}
            </div>
          `,
        });
        emailSent = true;
      }
    } catch (_) {
      // swallow mail errors
    }

    return NextResponse.json({ ok: true, emailSent }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? 'Unknown error' },
      { status: 500 },
    );
  }
}