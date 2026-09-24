const Joi = require('joi');
// Every body is allowlisted (stripUnknown) + length-capped: hostile keys like
// $ne / __proto__ / 10MB blobs are dropped or rejected before touching Oracle.
const v = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ error: 'Validation failed', details: error.details.map(d => d.message) });
  req.body = value; next();
};
// UUIDv4 path params only — kills path-traversal + SQLi probes in :id routes.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const vId = (name = 'id') => (req, res, next) => {
  const val = req.params[name];
  if (typeof val !== 'string' || val.length > 40 || !UUID_RE.test(val)) {
    if (name === 'alumniId') return next(); // /slots/:alumniId validated as UUID only when UUID-shaped
    return res.status(400).json({ error: 'Invalid id format' });
  }
  next();
};
const PW = Joi.string().min(10).max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
  .message('Password needs 10+ chars with upper, lower and digit');
const schemas = {
  register: Joi.object({
    email: Joi.string().email().max(191).required(),
    password: PW.required(),
    full_name: Joi.string().min(2).max(120).required(),
    role: Joi.string().valid('student', 'alumni').required(),
    languages: Joi.array().items(Joi.string().max(30)).max(5).default(['English'])
  }),
  login: Joi.object({ email: Joi.string().email().max(191).required(), password: Joi.string().max(128).required() }),
  request: Joi.object({
    title: Joi.string().min(4).max(150).required(),
    goal_type: Joi.string().valid('placement', 'higher_studies', 'startup', 'skill', 'research').required(),
    domain: Joi.string().min(2).max(80).required(),
    language: Joi.string().max(30).default('English'),
    description: Joi.string().max(1000).allow(''),
    freeDays: Joi.array().items(Joi.number().min(0).max(6)).max(7).default([1, 3, 5])
  }),
  slot: Joi.object({
    day_of_week: Joi.number().min(0).max(6).required(),
    start_time: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
    end_time: Joi.string().pattern(/^\d{2}:\d{2}$/).required()
  }),
  meeting: Joi.object({
    match_id: Joi.string().guid({ version: 'uuidv4' }).required(),
    scheduled_start: Joi.date().iso().required(),
    scheduled_end: Joi.date().iso().required(),
    mode: Joi.string().valid('online', 'offline').default('online'),
    meet_link: Joi.string().uri().max(500).allow('', null)
  }),
  goal: Joi.object({
    title: Joi.string().min(3).max(150).required(),
    target_date: Joi.date().iso().required(),
    match_id: Joi.string().guid({ version: 'uuidv4' }).allow(null, '')
  }),
  profile: Joi.object({
    full_name: Joi.string().min(2).max(120).required(),
    languages: Joi.array().items(Joi.string().max(30)).max(5).default(['English']),
    bio: Joi.string().max(500).allow('', null),
    department: Joi.string().max(80).allow('', null),
    study_year: Joi.number().min(1).max(5).allow(null),
    domain_interests: Joi.array().items(Joi.string().max(40)).max(10).allow(null),
    company: Joi.string().max(120).allow('', null),
    designation: Joi.string().max(120).allow('', null),
    expertise_tags: Joi.array().items(Joi.string().max(40)).max(10).allow(null),
    years_exp: Joi.number().min(0).max(50).allow(null),
    max_mentees: Joi.number().min(1).max(20).allow(null)
  }),
  feedback: Joi.object({
    meeting_id: Joi.string().guid({ version: 'uuidv4' }).required(),
    rating: Joi.number().min(1).max(5).required(),
    communication_rating: Joi.number().min(1).max(5).allow(null),
    relevance_rating: Joi.number().min(1).max(5).allow(null),
    comment: Joi.string().max(1000).allow(''),
    tags: Joi.array().items(Joi.string().max(30)).max(10).default([])
  })
};
module.exports = { v, vId, schemas };
