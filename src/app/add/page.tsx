"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import ResourceForm from "../../components/ResourceForm";
import { createResource } from "../../services/resourceService";

export default function AddResourcePage() {
  const router = useRouter();

  const initialData = {
    name: "",
    type: "",
    capacity: "",
    location: "",
    availabilityStart: "",
    availabilityEnd: "",
    status: "ACTIVE",
  };

  const handleCreate = async (data: {
    name: string;
    type: string;
    capacity: string | number;
    location: string;
    availabilityStart: string;
    availabilityEnd: string;
    status: string;
  }) => {
    try {
      await createResource({
        ...data,
        capacity: Number(data.capacity),
      });

      alert("Resource added successfully");
      router.push("/");
    } catch (error) {
      console.error("Error adding resource:", error);
      alert("Failed to add resource");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Add Resource</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create a new facility or asset record
            </p>
          </div>

          <Link
            href="/"
            className="rounded-xl bg-gray-600 px-4 py-2 font-medium text-white transition hover:bg-gray-700"
          >
            Back
          </Link>
        </div>

        <ResourceForm initialData={initialData} onSubmit={handleCreate} submitLabel="Save Resource" />
      </div>
    </main>
  );
}