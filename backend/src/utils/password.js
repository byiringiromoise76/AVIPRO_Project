// src/utils/password.js
// This file provides password hashing and verification utilities
// It uses bcrypt library for secure password storage and comparison
// Bcrypt is a one-way hashing algorithm designed specifically for passwords

// Import bcrypt library for password hashing and comparison
import bcrypt from "bcrypt";

// Hash a plain text password
// This function converts a plain text password into a secure hash
// The hash is one-way - it cannot be decrypted back to the original password
// @param {string} password - The plain text password to hash
// @returns {Promise<string>} The hashed password
export async function hashPassword(password) {
    const saltRounds = 10; // Number of salt rounds (higher = more secure but slower)
    // Generate a salt and hash the password with it
    // The salt is randomly generated and included in the hash
    return await bcrypt.hash(password, saltRounds);
}

// Compare a plain text password with a hashed password
// This function verifies if a plain text password matches a stored hash
// @param {string} password - The plain text password to verify
// @param {string} hashedPassword - The stored hashed password to compare against
// @returns {Promise<boolean>} True if passwords match, false otherwise
export async function comparePassword(password, hashedPassword) {
    // bcrypt.compare extracts the salt from the hash and hashes the input password
    // It then compares the two hashes to see if they match
    return await bcrypt.compare(password, hashedPassword);
}