import axios from "axios";

const API_URL = "http://localhost:8082/resources";

export const getAllResources = () => axios.get(API_URL);

export const getResourceById = (id) => axios.get(`${API_URL}/${id}`);

export const createResource = (resource) => axios.post(API_URL, resource);

export const updateResource = (id, resource) =>
  axios.put(`${API_URL}/${id}`, resource);

export const deleteResource = (id) => axios.delete(`${API_URL}/${id}`);