import Link from "next/link";


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

type Props = {
  resources: Resource[];
  onDelete: (id: number) => void;
};

export default function ResourceTable({ resources, onDelete }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="px-4 py-3 font-semibold">Name</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3 font-semibold">Capacity</th>
            <th className="px-4 py-3 font-semibold">Location</th>
            <th className="px-4 py-3 font-semibold">Availability Start</th>
            <th className="px-4 py-3 font-semibold">Availability End</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {resources.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                No resources found.
              </td>
            </tr>
          ) : (
            resources.map((resource) => (
              <tr key={resource.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{resource.name}</td>
                <td className="px-4 py-3">{resource.type}</td>
                <td className="px-4 py-3">{resource.capacity}</td>
                <td className="px-4 py-3">{resource.location}</td>
                <td className="px-4 py-3">{resource.availabilityStart}</td>
                <td className="px-4 py-3">{resource.availabilityEnd}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      resource.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {resource.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/details/${resource.id}`}
                      className="rounded-lg bg-cyan-500 px-3 py-2 text-white transition hover:bg-cyan-600"
                    >
                      View
                    </Link>

                    <Link
                      href={`/edit/${resource.id}`}
                      className="rounded-lg bg-amber-500 px-3 py-2 text-white transition hover:bg-amber-600"
                    >
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() => onDelete(resource.id)}
                      className="rounded-lg bg-red-500 px-3 py-2 text-white transition hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}