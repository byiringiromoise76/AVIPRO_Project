// src/modules/processing/processing.controller.js
import * as processingService from "./processing.service.js";

export async function listQueue(req, res, next) {
  try {
    const data = await processingService.getWorkQueue(req.auth);
    return res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function getDetail(req, res, next) {
  try {
    const orderId = Number(req.params.orderId);
    const data = await processingService.getProcessingDetail(orderId, req.auth);
    return res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function addNote(req, res, next) {
  try {
    const orderId = Number(req.params.orderId);
    const data = await processingService.addProcessingNote({
      orderId,
      actor: req.auth,
      note: req.body.note,
    });
    return res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function start(req, res, next) {
  try {
    const orderId = Number(req.params.orderId);
    const data = await processingService.startProcessing({
      orderId,
      actor: req.auth,
      comment: req.body.comment || null,
    });
    return res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function complete(req, res, next) {
  try {
    const orderId = Number(req.params.orderId);
    const data = await processingService.completeProcessing({
      orderId,
      actor: req.auth,
      comment: req.body.comment || null,
    });
    return res.json({ data });
  } catch (error) {
    next(error);
  }
}