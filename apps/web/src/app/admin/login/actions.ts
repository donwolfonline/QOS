'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signAdminToken } from '@/lib/auth';

export async function loginAction(formData: FormData) {
  const passcode = formData.get('passcode');
  
  // Hardcoded passcode for demonstration of zero-dependency auth
  // In a real system, this would hash against a DB entry
  if (passcode !== 'NEO') {
    return { error: 'ACCESS DENIED. INVALID CREDENTIALS.' };
  }

  // Create token payload
  const token = await signAdminToken({ admin: true, user: 'neo' });

  // Set the HTTP-only secure cookie
  const cookieStore = await cookies();
  cookieStore.set({
    name: 'QOS_ADMIN_SESSION',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  redirect('/admin/dashboard');
}
