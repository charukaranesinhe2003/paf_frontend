import axios from 'axios';

const BASE_URL = 'http://localhost:8081/api/bookings';

const api = axios.create({ baseURL: BASE_URL });

export const createBooking     = (data: any)                      => api.post('/', data);
export const getAllBookings    = (status: string | null)          => api.get('/', { params: status ? { status } : {} });
export const getBookingById    = (id: number)                     => api.get(`/${id}`);
export const getBookingsByUser = (userId: string)                 => api.get(`/user/${userId}`);
export const approveOrReject   = (id: number, data: any)          => api.patch(`/${id}/status`, data);
export const cancelBooking     = (id: number, userId: string)     => api.patch(`/${id}/cancel`, null, { params: { userId } });