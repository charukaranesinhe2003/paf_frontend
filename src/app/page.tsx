"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ResourceTable from "../components/ResourceTable";
import { deleteResource, getAllResources } from "../services/resourceService";

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

export default function HomePage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchType, setSearchType] = useState("");
  const [searchLocation, setSearchLocation] = useState("");

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const response = await getAllResources();
      setResources(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error loading resources:", error);
      alert("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this resource?"
    );
    if (!confirmed) return;

    try {
      await deleteResource(id);
      setResources((prev) => prev.filter((resource) => resource.id !== id));
      alert("Resource deleted successfully");
    } catch (error) {
      console.error("Error deleting resource:", error);
      alert("Failed to delete resource");
    }
  };

  const filteredResources = resources.filter((resource) => {
    const type = resource.type ? resource.type.toLowerCase() : "";
    const location = resource.location ? resource.location.toLowerCase() : "";

    return (
      type.includes(searchType.toLowerCase()) &&
      location.includes(searchLocation.toLowerCase())
    );
  });

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm border border-gray-200 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Facilities & Assets Catalogue
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage lecture halls, labs, meeting rooms, and equipment
            </p>
          </div>

          <Link
            href="/add"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            Add Resource
          </Link>
        </div>

        <div className="mb-6 grid gap-4 rounded-2xl bg-white p-6 shadow-sm border border-gray-200 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Search by Type
            </label>
            <input
              type="text"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              placeholder="Enter type"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Search by Location
            </label>
            <input
              type="text"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="Enter location"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm border border-gray-200">
            Loading resources...
          </div>
        ) : (
          <ResourceTable resources={filteredResources} onDelete={handleDelete} />
        )}
      </div>
    </main>
  );
}