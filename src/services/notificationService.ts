import axiosInstance from "./axiosInstance";

export interface NotificationDTO {
  id: number;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

/** Fetch all notifications for the current user (newest first) */
export async function getMyNotifications(): Promise<NotificationDTO[]> {
  const res = await axiosInstance.get<NotificationDTO[]>("/api/notifications");
  return res.data;
}

/** Mark a single notification as read */
export async function markNotificationRead(id: number): Promise<NotificationDTO> {
  const res = await axiosInstance.patch<NotificationDTO>(
    `/api/notifications/${id}/read`
  );
  return res.data;
}
