import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

import { getPasswordResetTokenByEmail } from "@/data/password-reset-token";
import { getTwoFactorTokenByEmail } from "@/data/two-factor-token";
import { getVerificationTokenByEmail } from "@/data/verificiation-token";
import { db } from "@/lib/db";

// Generates a two-factor authentication token
export const generateTwoFactorToken = async (email: string) => {
  // Generate a random token between 100,000 and 999,999
  const token = crypto.randomInt(100_000, 1_000_000).toString();
  const expires = new Date(new Date().getTime() + 5 * 60 * 1000); // Expires in 5 minutes

  const existingToken = await getTwoFactorTokenByEmail(email);

  if (existingToken) {
    // Delete the existing token if it exists
    await db.twoFactorToken.delete({
      where: {
        id: existingToken.id,
      }
    });
  }

  // Create a new two-factor token
  const twoFactorToken = await db.twoFactorToken.create({
    data: {
      email,
      token,
      expires,
    }
  });

  return twoFactorToken;
}

// Generates a password reset token
export const generatePasswordResetToken = async (email: string) => {
  // Generate a UUID-based token
  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 3600 * 1000); // Expires in 1 hour

  const existingToken = await getPasswordResetTokenByEmail(email);

  if (existingToken) {
    // Delete the existing token if it exists
    await db.passwordResetToken.delete({
      where: { id: existingToken.id }
    });
  }

  // Create a new password reset token
  const passwordResetToken = await db.passwordResetToken.create({
    data: {
      email,
      token,
      expires
    }
  });

  return passwordResetToken;
}

// Generates a verification token
export const generateVerificationToken = async (email: string) => {
  // Generate a UUID-based token
  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 3600 * 1000); // Expires in 1 hour

  const existingToken = await getVerificationTokenByEmail(email);

  if (existingToken) {
    // Delete the existing token if it exists
    await db.verificationToken.delete({
      where: {
        id: existingToken.id,
      },
    });
  }

  // Create a new verification token
  const verificationToken = await db.verificationToken.create({
    data: {
      email,
      token,
      expires,
    }
  });

  return verificationToken;
};
