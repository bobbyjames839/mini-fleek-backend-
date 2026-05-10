"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const missingSupabaseEnv = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'].filter((key) => !process.env[key]);
if (missingSupabaseEnv.length > 0) {
    console.warn(`Supabase env vars missing: ${missingSupabaseEnv.join(', ')}. Auth endpoints will return 503 until configured.`);
}
exports.env = {
    port: Number(process.env.PORT || 4000),
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    supabaseConfigured: missingSupabaseEnv.length === 0,
    frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
};
