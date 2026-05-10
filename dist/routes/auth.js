"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supabase_1 = require("../lib/supabase");
const router = express_1.default.Router();
const getSupabaseClient = (res) => {
    if (supabase_1.supabase) {
        return supabase_1.supabase;
    }
    res.status(503).json({
        error: 'Auth is unavailable. Configure SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env.',
    });
    return null;
};
router.post('/signup', async (req, res) => {
    const supabaseClient = getSupabaseClient(res);
    if (!supabaseClient) {
        return;
    }
    const { email, password } = (req.body || {});
    if (!email || !password) {
        return res.status(400).json({
            error: 'Email and password are required.',
        });
    }
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    return res.status(201).json({
        user: data.user,
        session: data.session,
    });
});
router.post('/login', async (req, res) => {
    const supabaseClient = getSupabaseClient(res);
    if (!supabaseClient) {
        return;
    }
    const { email, password } = (req.body || {});
    if (!email || !password) {
        return res.status(400).json({
            error: 'Email and password are required.',
        });
    }
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        return res.status(401).json({ error: error.message });
    }
    return res.status(200).json({
        user: data.user,
        session: data.session,
    });
});
router.get('/me', async (req, res) => {
    const supabaseClient = getSupabaseClient(res);
    if (!supabaseClient) {
        return;
    }
    const authHeader = req.header('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
        return res.status(401).json({ error: 'Missing bearer token.' });
    }
    const { data, error } = await supabaseClient.auth.getUser(token);
    if (error || !data?.user) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
    return res.status(200).json({ user: data.user });
});
router.post('/logout', async (req, res) => {
    const supabaseClient = getSupabaseClient(res);
    if (!supabaseClient) {
        return;
    }
    const authHeader = req.header('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
        return res.status(401).json({ error: 'Missing bearer token.' });
    }
    const { data, error } = await supabaseClient.auth.getUser(token);
    if (error || !data?.user) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
    return res.status(200).json({ success: true });
});
exports.default = router;
