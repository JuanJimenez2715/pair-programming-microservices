const sessionService = require('../services/session.service');

const createSession = async (req, res, next) => {
  try {
    const session = await sessionService.createSession(req.user.sub, req.body.exerciseId);
    res.status(201).send(session);
  } catch (error) { next(error); }
};

const getSessions = async (req, res, next) => {
  try {
    const sessions = await sessionService.getSessions();
    res.send(sessions);
  } catch (error) { next(error); }
};

const getSessionById = async (req, res, next) => {
  try {
    const session = await sessionService.getSessionById(req.params.id);
    res.send(session);
  } catch (error) { next(error); }
};

const joinSession = async (req, res, next) => {
  try {
    const session = await sessionService.joinSession(req.params.id, req.user.sub);
    res.send(session);
  } catch (error) { next(error); }
};

const swapRoles = async (req, res, next) => {
  try {
    const session = await sessionService.swapRoles(req.params.id);
    res.send(session);
  } catch (error) { next(error); }
};

const completeSession = async (req, res, next) => {
  try {
    const session = await sessionService.completeSession(req.params.id);
    res.send(session);
  } catch (error) { next(error); }
};

module.exports = { createSession, getSessions, getSessionById, joinSession, swapRoles, completeSession };