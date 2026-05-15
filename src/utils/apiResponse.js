/**
 * Standard API response helpers.
 * All controller responses go through here for a consistent shape.
 */

const ok      = (res, data)    => res.status(200).json(data);
const created = (res, data)    => res.status(201).json(data);
const badRequest  = (res, message) => res.status(400).json({ message });
const unauthorized= (res, message) => res.status(401).json({ message });
const forbidden   = (res, message) => res.status(403).json({ message });
const notFound    = (res, message) => res.status(404).json({ message });
const conflict    = (res, message) => res.status(409).json({ message });

module.exports = { ok, created, badRequest, unauthorized, forbidden, notFound, conflict };
