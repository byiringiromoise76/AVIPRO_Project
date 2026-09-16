/**
 * src/modules/processing/processing.controller.js
 * 
 * HTTP handlers for the processing work queue.
 * req.auth is always set — routes are protected by authenticate middleware.
 */
import * as processingService from "./processing.service.js";

/**
 * GET /api/processing — List the work queue (approved + in-progress orders).
 */
export async function listQueue(req, res, next) {
    try {
        const data = await processingService.getWorkQueue(req.auth);
        return res.json({ data });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/processing/:orderId — Get processing details for one order.
 */
export async function getDetail(req, res, next) {
    try {
        const orderId = Number(req.params.orderId);
        const data = await processingService.getProcessingDetail(orderId, req.auth);
        return res.json({ data });
    } catch (error) {
        next(error);
    }
}

/**
 * PATCH /api/processing/:orderId/notes — Add a processing note.
 */
export async function addNote(req, res, next) {
    try {
        const orderId = Number(req.params.orderId);
        const data = await processingService.addProcessingNote({
            orderId,
            actor: req.auth,
            note: req.body.note
        });
        return res.json({ data });
    } catch (error) {
        next(error);
    }
}

/**
 * PATCH /api/processing/:orderId/start — Start processing an order.
 */
export async function start(req, res, next) {
    try {
        const orderId = Number(req.params.orderId);
        const data = await processingService.startProcessing({
            orderId,
            actor: req.auth,
            comment: req.body.comment || null
        });
        return res.json({ data });
    } catch (error) {
        next(error);
    }
}

/**
 * PATCH /api/processing/:orderId/complete — Complete processing of an order.
 */
export async function complete(req, res, next) {
    try {
        const orderId = Number(req.params.orderId);
        const data = await processingService.completeProcessing({
            orderId,
            actor: req.auth,
            comment: req.body.comment || null
        });
        return res.json({ data });
    } catch (error) {
        next(error);
    }
}