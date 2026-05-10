"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const env_1 = require("./config/env");
const auth_1 = __importDefault(require("./routes/auth"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: env_1.env.frontendOrigin,
    credentials: true,
}));
app.use(express_1.default.json());
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});
app.use('/auth', auth_1.default);
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
});
app.listen(env_1.env.port, () => {
    console.log(`Mini Fleek backend listening on http://localhost:${env_1.env.port}`);
});
