/**
 * src/modules/users/user.routes.js
 * 
 * HTTP routes for user management.
 * All user management endpoints are ADMIN-only.
 */
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { createUserSchema, updateUserSchema, changePasswordSchema } from "./user.validation.js";
import { getAllUsers, getUserById, createUser, updateUser, deleteUser, changePassword, toggleActive } from "./user.controller.js";

const router = Router();

// All user management routes require ADMIN role
router.use(authenticate, authorize("ADMIN"));

// GET /api/users — Get all users
router.get("/", getAllUsers);

// GET /api/users/:id — Get a user by ID
router.get("/:id", getUserById);

// POST /api/users — Create a new user
router.post("/", validate(createUserSchema), createUser);

// PUT /api/users/:id — Update a user
router.put("/:id", validate(updateUserSchema), updateUser);

// DELETE /api/users/:id — Delete a user
router.delete("/:id", deleteUser);

// POST /api/users/:id/change-password — Change a user's password
router.post("/:id/change-password", validate(changePasswordSchema), changePassword);

// PATCH /api/users/:id/toggle-active — Activate/deactivate a user
router.patch("/:id/toggle-active", toggleActive);

export default router;