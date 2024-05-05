import { PrismaAdapter } from '@auth/prisma-adapter';
import { UserRole } from '@prisma/client';
import NextAuth from 'next-auth';
import authConfig from '@/auth.config';
import { getTwoFactorConfirmationByUserId } from '@/data/two-factor-confirmation';
import { getUserById } from '@/data/user';
import { db } from '@/lib/db';
import { getAccountByUserId } from './data/account';

interface User {
  id: string;
  name: string;
  email: string;
  isTwoFactorEnabled: boolean;
  role: UserRole; // or whatever type the role property is
}

// Define the update function
export const update = async ({ user }: { user: User }) => {
  try {
    // Update the user information in the database
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        name: user.name,
        email: user.email,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
        role: user.role,
      },
    });

    // Return the updated user
    return updatedUser;
  } catch (error) {
    // Handle any errors that occur during the update process
    console.error('Error updating user:', error);
    throw new Error('Failed to update user');
  }
};


// Destructuring properties from NextAuth and assigning them to respective constants
export const {
  handlers: { GET, POST }, // GET and POST request handlers
  auth, // Authentication function
  signIn, // Sign in function
  signOut, // Sign out function
} = NextAuth({
  pages: {
    signIn: '/auth/login', // Custom sign-in page
    error: '/auth/error', // Custom error page
  },
  events: {
    // Event handler for linking accounts
    async linkAccount({ user }) {
      // Updating email verification status for the user in the database
      await db.user.update({
        where: { id: user.id || ''},
        data: { emailVerified: new Date() },
         
      });
    },
  },
  callbacks: {
    // Callback function executed upon sign in
    async signIn({ user, account }) {
      // Allowing OAuth without email verification
      if (account?.provider !== 'credentials') return true;

      // Checking if user id exists
      if (!user.id) return false;

      // Retrieving existing user from the database
      const existingUser = await getUserById(user.id);

      // Preventing sign in without email verification
      if (!existingUser?.emailVerified) return false;

      // Checking if two-factor authentication is enabled for the user
      if (existingUser.isTwoFactorEnabled) {
        // Retrieving two-factor confirmation for the user from the database
        const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(
          existingUser.id
        );

        // Returning false if two-factor confirmation does not exist
        if (!twoFactorConfirmation) return false;

        // Deleting two-factor confirmation for next sign in
        await db.twoFactorConfirmation.delete({
          where: { id: twoFactorConfirmation.id },
        });
      }

      // Returning true to allow sign in
      return true;
    },
    // Callback function executed upon session creation
    async session({ token, session }) {
      // Setting user id in session if present in token
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      // Setting user role in session if present in token
      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
      }

      // Setting two-factor authentication status in session if present in token
      if (session.user) {
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean;
      }

      // Setting user name, email, and OAuth status in session if present in token
      if (session.user && token.email) {
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.isOAuth = token.isOAuth as boolean;
      }

      // Returning updated session
      return session;
    },
    // Callback function executed upon JWT creation
    async jwt({ token }) {
      
      // Returning token if user id is not present
      if (!token.sub) return token;

      // Retrieving existing user from the database
      const existingUser = await getUserById(token.sub);

      // Returning token if existing user is not found
      if (!existingUser) return token;

      // Retrieving existing account associated with the user
      const existingAccount = await getAccountByUserId(existingUser.id);

      // Setting OAuth status, name, email, role, and two-factor authentication status in token
      token.isOAuth = !!existingAccount;
      token.name = existingUser.name;
      token.email = existingUser.email;
      token.role = existingUser.role;
      token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled;

      // Returning updated token
      return token;
    },
  },
  
  // Using PrismaAdapter with provided database for session storage
  adapter: PrismaAdapter(db),
  // Configuring session strategy
  session: { strategy: 'jwt' },
  // Merging with additional authentication configuration
  ...authConfig,
});
