// src/modules/orders/order.controller.js
import * as orderService from "./order.service.js";

// Helper function to get actor info (for testing without auth)
const getActor = (req) => {
  return req.auth || {
    userId: 1,
    branchId: 1, // Always use main branch
    role: "ADMIN"
  };
};

export async function getAllOrders(req, res, next) {
  try {
    const orders = await orderService.getAllOrders();
    return res.status(200).json({ data: orders });
  } catch (error) {
    next(error);
  }
}

export async function logOrder(req, res, next) {
  try {
    const result = await orderService.logOrder({
      actor: getActor(req),
      customer: req.body.customer,
      items: req.body.items,
    });
    return res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
}

const makeTransitionHandler = (serviceFn) => async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const result = await serviceFn({
      orderId,
      actor: getActor(req),
      comment: req.body.comment || null,
    });
    return res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
};

export const approveOrder = makeTransitionHandler(orderService.approveOrder);
export const startProcessing = makeTransitionHandler(orderService.startProcessing);
export const completeProcessing = makeTransitionHandler(orderService.completeProcessing);
export const markReadyForDelivery = makeTransitionHandler(orderService.markReadyForDelivery);
export const markDeliveredAndClose = makeTransitionHandler(orderService.markDeliveredAndClose);