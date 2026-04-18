"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ResourceForm from "../../../components/ResourceForm";
import { getResourceById, updateResource } from "../../../services/resourceService";

type FormDataType = {
  name: string;
  type: string;
  capacity: string | number;
  location: string;
  availabilityStart: string;
  availabilityEnd: string;
  status: string;
};

export default function EditResourcePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [initialData, setInitialData] = useState<FormDataType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResource();
  }, []);

  const loadResource = async () => {
    try {
      const response = await getResourceById(id);
      const data = response.data;

      setInitialData({
        name: data.name || "",
        type: data.type || "",
        capacity: data.capacity ?? "",
        location: data.location || "",
        availabilityStart: data.availabilityStart || "",
        availabilityEnd: data.availabilityEnd || "",
        status: data.status || "ACTIVE",
      });
    } catch (error) {
      console.error("Error loading resource:", error);
      alert("Failed to load resource");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: FormDataType) => {
    try {
      await updateResource(id, {
        ...data,
        capacity: Number(data.capacity),
      });

      alert("Resource updated successfully");
      router.push("/");
    } catch (error) {
      console.error("Error updating resource:", error);
      alert("Failed to update resource");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Edit Resource</h1>
            <p className="mt-1 text-sm text-gray-500">
              Update the selected facility or asset
            </p>
          </div>

          <Link
            href="/"
            className="rounded-xl bg-gray-600 px-4 py-2 font-medium text-white transition hover:bg-gray-700"
          >
            Back
          </Link>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm border border-gray-200">
            Loading resource...
          </div>
        ) : initialData ? (
          <ResourceForm
            initialData={initialData}
            onSubmit={handleUpdate}
            submitLabel="Update Resource"
          />
        ) : (
          <div className="rounded-2xl bg-white p-6 text-center text-red-500 shadow-sm border border-gray-200">
            Resource not found.
          </div>
        )}
      </div>
    </main>
  );
}