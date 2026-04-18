"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getResourceById } from "../../../services/resourceService";

type Resource = {
  id: number;
  name: string;
  type: string;
  capacity: number;
  location: string;
  availabilityStart: string;
  availabilityEnd: string;
  status: string;
};

export default function ResourceDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResource();
  }, []);

  const loadResource = async () => {
    try {
      const response = await getResourceById(id);
      setResource(response.data);
    } catch (error) {
      console.error("Error loading resource details:", error);
      alert("Failed to load resource details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Resource Details
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View full details of the selected resource
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
            Loading resource details...
          </div>
        ) : !resource ? (
          <div className="rounded-2xl bg-white p-6 text-center text-red-500 shadow-sm border border-gray-200">
            Resource not found.
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">ID</p>
                <p className="mt-1 font-semibold text-gray-800">{resource.id}</p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Name</p>
                <p className="mt-1 font-semibold text-gray-800">{resource.name}</p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Type</p>
                <p className="mt-1 font-semibold text-gray-800">{resource.type}</p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Capacity</p>
                <p className="mt-1 font-semibold text-gray-800">
                  {resource.capacity}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Location</p>
                <p className="mt-1 font-semibold text-gray-800">
                  {resource.location}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Status</p>
                <p
                  className={`mt-1 inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                    resource.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {resource.status}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Availability Start</p>
                <p className="mt-1 font-semibold text-gray-800">
                  {resource.availabilityStart}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Availability End</p>
                <p className="mt-1 font-semibold text-gray-800">
                  {resource.availabilityEnd}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href={`/edit/${resource.id}`}
                className="rounded-xl bg-amber-500 px-5 py-3 font-medium text-white transition hover:bg-amber-600"
              >
                Edit Resource
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}