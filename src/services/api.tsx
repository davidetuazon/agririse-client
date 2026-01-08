import axios from 'axios';
import { ACCESS_TOKEN } from '../utils/constants';
import Cookies from 'js-cookie';

const BASE_URL = import.meta.env.VITE_APP_URL ?? 'http://localhost:5000';
const BASE_PATH = `${BASE_URL}/api/v1`;

const api = axios.create({
    baseURL: BASE_PATH,
});

api.interceptors.request.use((config) => {
    const token = Cookies.get(ACCESS_TOKEN);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config;
});

export const me = async () => {
    try {
        const res = await api.get('user/me');
        return res.data;
    } catch (e) {
        throw new Error("Failed fetch on:'/me'");
    }
}

export const login = async (email: string, password: string) => {
    // eslint-disable-next-line no-useless-catch
    try {
        const res = await api.post('/user/login', { email, password}, {});
        return res.data;
    } catch (e) {
        throw e;
    }
}

export const latest = async () => {
    // eslint-disable-next-line no-useless-catch
    try {
        const res = await api.get('/iot/latest');
        return res.data;
    } catch (e) {
        throw e;
    }
}

export const getAnalytics = async ({ sensorType, period }: {sensorType: string, period: string}) => {
    try {
        const res = await api.get('/iot/analytics', { params: { sensorType, period } });
        return res.data;
    } catch (e) {
        throw new Error('Failed data fetch');
    }
}