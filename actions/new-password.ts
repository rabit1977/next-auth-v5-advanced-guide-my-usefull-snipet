"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { NewPasswordSchema } from "@/schemas";
import { getPasswordResetTokenByToken } from "@/data/password-reset-token";
import { getUserByEmail } from "@/data/user";
import { db } from "@/lib/db";

// Defining an asynchronous function named newPassword that takes values and an optional token as parameters
export const newPassword = async (
  values: z.infer<typeof NewPasswordSchema>, // Parameter values should conform to NewPasswordSchema
  token?: string | null // Optional token parameter, defaulting to null
) => {
  // Checking if token is missing
  if (!token) {
    return { error: "Missing token!" }; // Returning an error object if token is missing
  }

  // Validating fields based on NewPasswordSchema
  const validatedFields = NewPasswordSchema.safeParse(values);

  // Checking if field validation was successful
  if (!validatedFields.success) {
    return { error: "Invalid fields!" }; // Returning an error object if fields are invalid
  }

  // Extracting password from validated data
  const { password } = validatedFields.data;

  // Retrieving existing password reset token based on provided token
  const existingToken = await getPasswordResetTokenByToken(token);

  // Checking if existing token is not found
  if (!existingToken) {
    return { error: "Invalid token!" }; // Returning an error object if token is invalid
  }

  // Checking if token has expired
  const hasExpired = new Date(existingToken.expires) < new Date();

  // Returning an error if token has expired
  if (hasExpired) {
    return { error: "Token has expired!" }; // Returning an error object if token has expired
  }

  // Retrieving user associated with the email in the existing token
  const existingUser = await getUserByEmail(existingToken.email);

  // Returning an error if user does not exist
  if (!existingUser) {
    return { error: "Email does not exist!" }; // Returning an error object if email does not exist
  }

  // Hashing the new password
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Executing a database transaction to update user password and delete the password reset token
    await db.$transaction([
      db.user.update({
        where: { id: existingUser.id },
        data: { password: hashedPassword },
      }),
      db.passwordResetToken.delete({
        where: { id: existingToken.id },
      }),
    ]);

    // Returning a success message if password update is successful
    return { success: "Password updated!" };
  } catch (error) {
    // Handling database transaction errors
    return { error: "An error occurred while updating the password." }; // Returning an error object if an error occurs during transaction
  }
};
