import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabaseAdmin } from './db';
import { compare } from 'bcryptjs';
import { randomUUID } from 'crypto';

async function getUserByEmail(email: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function incrementFailure(email: string) {
  const user = await getUserByEmail(email);
  const attempts = (user?.failed_attempts || 0) + 1;
  const locked_until = attempts >= 10 ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : null;
  await supabaseAdmin
    .from('users')
    .update({ failed_attempts: attempts, locked_until })
    .eq('email', email);
  return locked_until;
}

async function resetFailures(email: string) {
  await supabaseAdmin
    .from('users')
    .update({ failed_attempts: 0, locked_until: null })
    .eq('email', email);
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  pages: {
    signIn: '/auth/signin'
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    }),
    CredentialsProvider({
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await getUserByEmail(credentials.email);
        if (!user) return null;
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
          throw new Error('Account locked. Try again later.');
        }
        if (!user.password_hash) return null;
        const valid = await compare(credentials.password, user.password_hash);
        if (!valid) {
          await incrementFailure(credentials.email);
          return null;
        }
        await resetFailures(credentials.email);
        return { id: user.id, email: user.email };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        const existing = await getUserByEmail(user.email);
        if (!existing) {
          await supabaseAdmin.from('users').insert({ id: randomUUID(), email: user.email });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
